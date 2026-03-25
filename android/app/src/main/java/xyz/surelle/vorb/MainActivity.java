package xyz.surelle.vorb;

import android.os.Build;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Allow ws:// (insecure WebSocket) from HTTPS pages for LAN daemon communication
    // This is safe since connections are to private IPs only (192.168.x.x, 10.x.x.x, 127.0.0.1)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      try {
        this.bridge.getWebView().getSettings().setMixedContentMode(
          WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        );
      } catch (Exception e) {
        android.util.Log.e("Orb", "Failed to set mixed content mode", e);
      }
    }
  }
}
