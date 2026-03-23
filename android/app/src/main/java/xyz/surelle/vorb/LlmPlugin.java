package xyz.surelle.vorb;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mediapipe.tasks.genai.llminference.LlmInference;
import com.google.mediapipe.tasks.genai.llminference.LlmInference.Backend;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "Llm")
public class LlmPlugin extends Plugin {

    private static final String TAG            = "OrbLLM";
    private static final String MODEL_FILENAME = "gemma3-1b-it-int4.task";
    private static final String MODEL_URL      =
        "https://huggingface.co/litert-community/Gemma3-1B-IT/resolve/main/gemma3-1b-it-int4.task?download=true";
    private static final String HF_TOKEN       = "hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // REPLACE WITH YOUR TOKEN

    private static final long MIN_VALID_SIZE  = 10 * 1024 * 1024L;
    private static final int  MAX_REDIRECTS   = 15;
    private static final int  CONNECT_TIMEOUT = 30_000;
    private static final int  READ_TIMEOUT    = 60_000;

    static final String NOTIF_CHANNEL_ID = "orb_llm_download";
    static final int    NOTIF_ID         = 9001;

    // Backend is user-configurable via Settings in the app.
    // Preference is stored in SharedPreferences under "orb_ai_backend".
    // Default: CPU (stable on all devices). GPU is faster but device-dependent.
    private Backend getPreferredBackend() {
        try {
            android.content.SharedPreferences prefs =
                getContext().getSharedPreferences("orb_prefs", android.content.Context.MODE_PRIVATE);
            String pref = prefs.getString("orb_ai_backend", "CPU");
            return "GPU".equals(pref) ? Backend.GPU : Backend.CPU;
        } catch (Exception e) {
            return Backend.CPU;
        }
    }

    private LlmInference llmInference = null;
    private boolean      modelReady   = false;
    private Thread       downloadThread = null;

    // ── Serialise generation so we never call generateResponse concurrently.
    // After a GPU crash the session is corrupt; CPU never crashes but we still
    // guard against concurrent calls which can produce garbage output. ────────
    private final Object generateLock = new Object();

    @Override
    public void load() {
        super.load();
        createNotificationChannel();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // loadModel
    // ─────────────────────────────────────────────────────────────────────────
    @PluginMethod
    public void loadModel(PluginCall call) {
        // If already ready, resolve immediately
        if (modelReady && llmInference != null) {
            JSObject r = new JSObject(); r.put("ready", true);
            notifyListeners("llmReady", r);
            call.resolve();
            return;
        }

        downloadThread = new Thread(() -> {
            try {
                Context ctx       = getContext();
                File    modelFile = new File(ctx.getFilesDir(), MODEL_FILENAME);
                File    tmpFile   = new File(ctx.getFilesDir(), MODEL_FILENAME + ".tmp");

                Log.d(TAG, "=== loadModel called ===");
                Log.d(TAG, "Model exists: " + modelFile.exists() + " (" + modelFile.length() + " bytes)");

                if (modelFile.exists() && modelFile.length() < MIN_VALID_SIZE) {
                    Log.w(TAG, "Completed model too small — deleting");
                    modelFile.delete();
                }

                if (!modelFile.exists()) {
                    notifyProgress(0, "Connecting to HuggingFace…");
                    downloadWithResume(tmpFile, modelFile);
                }

                showNotification("Orb AI — Loading", "Loading model on CPU…", -1);
                notifyProgress(90, "Loading model on CPU…");
                Log.d(TAG, "Creating LlmInference…");
                startLoadPulse();

                // ── Read backend preference from SharedPreferences ─────────
                Backend chosenBackend = getPreferredBackend();
                Log.d(TAG, "Using backend: " + chosenBackend.name());
                notifyProgress(90, "Loading Orb AI (" + chosenBackend.name() + ")…");

                LlmInference.LlmInferenceOptions opts =
                        LlmInference.LlmInferenceOptions.builder()
                                .setModelPath(modelFile.getAbsolutePath())
                                .setMaxTokens(1024)
                                .setPreferredBackend(chosenBackend)
                                .build();

                llmInference = LlmInference.createFromOptions(ctx, opts);
                modelReady   = true;

                Log.d(TAG, "Model loaded (" + getPreferredBackend().name() + ") ✓");
                cancelNotification();
                showCompletionNotification();
                notifyProgress(100, "Orb AI is ready");

                JSObject readyEvt = new JSObject();
                readyEvt.put("ready", true);
                notifyListeners("llmReady", readyEvt);
                call.resolve();

            } catch (Exception e) {
                Log.e(TAG, "loadModel FAILED: " + e.getMessage(), e);
                showErrorNotification(e.getMessage());
                notifyError(e.getMessage());
                call.reject("Failed to load model: " + e.getMessage());
            }
        });
        downloadThread.setDaemon(false);
        downloadThread.start();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // generate
    // ─────────────────────────────────────────────────────────────────────────
    @PluginMethod
    public void generate(PluginCall call) {
        if (!modelReady || llmInference == null) {
            call.reject("Model not ready");
            return;
        }
        String prompt = call.getString("prompt", "");
        if (prompt == null || prompt.isEmpty()) {
            call.reject("No prompt");
            return;
        }

        new Thread(() -> {
            synchronized (generateLock) {
                // Guard: re-check inside lock in case a previous call wiped the session
                if (llmInference == null) {
                    call.reject("Model session unavailable — call loadModel again");
                    return;
                }
                try {
                    Log.d(TAG, "Generating (CPU)…");
                    String response = llmInference.generateResponse(prompt);
                    Log.d(TAG, "Generation complete (" + response.length() + " chars)");

                    JSObject tok = new JSObject();
                    tok.put("token", response);
                    notifyListeners("llmToken", tok);
                    notifyListeners("llmDone", new JSObject());
                    call.resolve();

                } catch (Exception e) {
                    Log.e(TAG, "generate FAILED: " + e.getMessage(), e);

                    // The session is now corrupt — tear it down so the next call
                    // to loadModel (which JS will do automatically) rebuilds it.
                    modelReady   = false;
                    llmInference = null;
                    Log.w(TAG, "Session torn down — JS should call loadModel to recover");

                    notifyError(e.getMessage());
                    call.reject("Generation failed: " + e.getMessage());
                }
            }
        }).start();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // isReady / isDownloaded / deleteModel
    // ─────────────────────────────────────────────────────────────────────────
    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ready", modelReady && llmInference != null);
        call.resolve(r);
    }

    @PluginMethod
    public void isDownloaded(PluginCall call) {
        File modelFile = new File(getContext().getFilesDir(), MODEL_FILENAME);
        File tmpFile   = new File(getContext().getFilesDir(), MODEL_FILENAME + ".tmp");
        JSObject r = new JSObject();
        r.put("downloaded", modelFile.exists() && modelFile.length() > MIN_VALID_SIZE);
        r.put("partial",    tmpFile.exists() && tmpFile.length() > 0);
        r.put("partialMB",  tmpFile.exists() ? tmpFile.length() / 1024 / 1024 : 0);
        call.resolve(r);
    }

    @PluginMethod
    public void deleteModel(PluginCall call) {
        if (downloadThread != null && downloadThread.isAlive()) downloadThread.interrupt();
        File modelFile = new File(getContext().getFilesDir(), MODEL_FILENAME);
        File tmpFile   = new File(getContext().getFilesDir(), MODEL_FILENAME + ".tmp");
        if (modelFile.exists()) modelFile.delete();
        if (tmpFile.exists())   tmpFile.delete();
        modelReady   = false;
        llmInference = null;
        JSObject r = new JSObject();
        r.put("deleted", true);
        call.resolve(r);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // setBackend — called from JS when user switches CPU/GPU in Settings
    // ─────────────────────────────────────────────────────────────────────────
    @PluginMethod
    public void setBackend(PluginCall call) {
        String backend = call.getString("backend", "CPU");
        if (!"CPU".equals(backend) && !"GPU".equals(backend)) {
            call.reject("Invalid backend. Use CPU or GPU.");
            return;
        }
        try {
            android.content.SharedPreferences prefs =
                getContext().getSharedPreferences("orb_prefs", android.content.Context.MODE_PRIVATE);
            prefs.edit().putString("orb_ai_backend", backend).apply();
            Log.d(TAG, "Backend preference saved: " + backend);

            // If model is loaded, tear it down so next loadModel uses new backend
            if (modelReady && llmInference != null) {
                synchronized (generateLock) {
                    modelReady   = false;
                    llmInference = null;
                    Log.d(TAG, "Session torn down — reload required for new backend");
                }
            }
            JSObject r = new JSObject();
            r.put("backend", backend);
            r.put("requiresReload", true);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("Failed to save backend: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getBackend — returns current preference
    // ─────────────────────────────────────────────────────────────────────────
    @PluginMethod
    public void getBackend(PluginCall call) {
        JSObject r = new JSObject();
        r.put("backend", getPreferredBackend().name());
        call.resolve(r);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Download helpers
    // ─────────────────────────────────────────────────────────────────────────
    private void downloadWithResume(File tmpFile, File finalFile) throws Exception {
        Log.d(TAG, "Download URL: " + MODEL_URL);
        String  currentUrl     = MODEL_URL;
        boolean sendAuthHeader = true;

        for (int redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
            Log.d(TAG, "Request #" + redirect + ": " + currentUrl);

            URL               url  = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(CONNECT_TIMEOUT);
            conn.setReadTimeout(READ_TIMEOUT);
            conn.setInstanceFollowRedirects(false);

            if (sendAuthHeader && currentUrl.contains("huggingface.co")) {
                conn.setRequestProperty("Authorization", "Bearer " + HF_TOKEN);
            }

            long resumeFrom = tmpFile.exists() ? tmpFile.length() : 0L;
            if (resumeFrom > 0) {
                conn.setRequestProperty("Range", "bytes=" + resumeFrom + "-");
                Log.d(TAG, "Resume from " + (resumeFrom / 1024 / 1024) + " MB");
            }

            conn.connect();
            int code = conn.getResponseCode();
            Log.d(TAG, "HTTP " + code);

            if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                String location = conn.getHeaderField("Location");
                conn.disconnect();
                if (location == null) throw new Exception("Redirect with no Location header");
                if (!location.startsWith("http")) location = new URL(url, location).toString();
                currentUrl = location;
                if (!currentUrl.contains("huggingface.co")) sendAuthHeader = false;
                continue;
            }

            if (code == 206) {
                long contentLength = conn.getContentLengthLong();
                long totalBytes    = resumeFrom + contentLength;
                notifyProgress(1, "Resuming from " + (resumeFrom / 1024 / 1024) + " MB…");
                streamToFile(conn, tmpFile, true, resumeFrom, totalBytes);
                conn.disconnect();
                finalizeDownload(tmpFile, finalFile);
                return;
            }

            if (code == 200) {
                long totalBytes = conn.getContentLengthLong();
                if (resumeFrom > 0) new FileOutputStream(tmpFile, false).close(); // restart
                streamToFile(conn, tmpFile, false, 0, totalBytes);
                conn.disconnect();
                finalizeDownload(tmpFile, finalFile);
                return;
            }

            String body = readErrorBody(conn);
            if (code == 401) throw new Exception("Unauthorized — check HF token. " + body);
            if (code == 403) throw new Exception("Forbidden — accept model license. " + body);
            throw new Exception("HTTP " + code + ": " + body);
        }
        throw new Exception("Too many redirects");
    }

    private void streamToFile(HttpURLConnection conn, File tmpFile,
                               boolean append, long alreadyHave, long totalBytes)
            throws Exception {
        try (InputStream in  = conn.getInputStream();
             FileOutputStream out = new FileOutputStream(tmpFile, append)) {

            byte[] buf             = new byte[128 * 1024];
            long   downloadedSoFar = alreadyHave;
            long   lastLoggedMB    = alreadyHave / 1024 / 1024;
            int    n;

            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
                downloadedSoFar += n;
                long currentMB = downloadedSoFar / 1024 / 1024;
                if (currentMB != lastLoggedMB) {
                    lastLoggedMB = currentMB;
                    int pct = totalBytes > 0
                            ? (int) Math.min(88, downloadedSoFar * 88L / totalBytes) : 0;
                    String msg = "Downloading… " + currentMB + " MB"
                            + (totalBytes > 0 ? " / " + (totalBytes / 1024 / 1024) + " MB" : "");
                    notifyProgress(pct, msg);
                    showNotification("Orb AI — Downloading", msg, pct);
                }
            }
        }
    }

    private void finalizeDownload(File tmpFile, File finalFile) throws Exception {
        if (tmpFile.length() < MIN_VALID_SIZE) {
            tmpFile.delete();
            throw new Exception("Downloaded file too small — corrupt?");
        }
        if (finalFile.exists()) finalFile.delete();
        if (!tmpFile.renameTo(finalFile))
            throw new Exception("Failed to rename tmp → final");
        Log.d(TAG, "Model file ready: " + finalFile.length() + " bytes");
        notifyProgress(88, "Download complete — loading model…");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notification helpers
    // ─────────────────────────────────────────────────────────────────────────
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    NOTIF_CHANNEL_ID, "Orb AI Download", NotificationManager.IMPORTANCE_LOW);
            ch.setSound(null, null);
            ch.enableVibration(false);
            NotificationManager nm = getContext().getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private void showNotification(String title, String text, int pct) {
        NotificationManager nm =
                (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Intent tapIntent = new Intent(getContext(), MainActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(getContext(), 0, tapIntent,
                PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(getContext(), NOTIF_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setContentTitle(title).setContentText(text)
                .setOngoing(true).setOnlyAlertOnce(true).setSilent(true)
                .setContentIntent(pi);
        if (pct >= 0) b.setProgress(100, pct, false);
        else          b.setProgress(100, 0, true);
        nm.notify(NOTIF_ID, b.build());
    }

    private void cancelNotification() {
        NotificationManager nm =
                (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIF_ID);
    }

    private void showCompletionNotification() {
        NotificationManager nm =
                (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Intent tapIntent = new Intent(getContext(), MainActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(getContext(), 0, tapIntent,
                PendingIntent.FLAG_IMMUTABLE);
        nm.notify(NOTIF_ID + 1, new NotificationCompat.Builder(getContext(), NOTIF_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.star_on)
                .setContentTitle("Orb AI is ready ✦")
                .setContentText("On-device AI is now active. Tap to open Orb.")
                .setAutoCancel(true).setContentIntent(pi).build());
    }

    private void showErrorNotification(String message) {
        NotificationManager nm =
                (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        nm.cancel(NOTIF_ID);
        nm.notify(NOTIF_ID + 2, new NotificationCompat.Builder(getContext(), NOTIF_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_error)
                .setContentTitle("Orb AI — Error")
                .setContentText(message).setAutoCancel(true).build());
    }

    private void notifyProgress(int pct, String message) {
        Log.d(TAG, "Progress " + pct + "%: " + message);
        JSObject evt = new JSObject();
        evt.put("pct", pct);
        evt.put("message", message);
        notifyListeners("llmProgress", evt);
    }

    private void notifyError(String message) {
        Log.e(TAG, "Error: " + message);
        JSObject evt = new JSObject();
        evt.put("message", message);
        notifyListeners("llmError", evt);
    }

    private String readErrorBody(HttpURLConnection conn) {
        try {
            InputStream es = conn.getErrorStream();
            if (es == null) return "(no body)";
            byte[] buf = new byte[2048];
            int n = es.read(buf);
            return n > 0 ? new String(buf, 0, n) : "(empty body)";
        } catch (Exception e) { return "(failed to read body)"; }
    }

    private void startLoadPulse() {
        new Thread(() -> {
            int i = 0;
            while (!modelReady) {
                try { Thread.sleep(8000); } catch (InterruptedException e) { break; }
                if (!modelReady) notifyProgress(90 + Math.min(9, i++),
                        "Loading on CPU… almost ready");
            }
        }).start();
    }
}