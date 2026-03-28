<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')"
        class="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
        <ChevronLeft :size="18" class="text-zinc-300" :stroke-width="2.5" />
      </button>
      <div class="flex-1">
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / help</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span> faq
        </h1>
      </div>
      <!-- Search toggle -->
      <button @click="searchOpen = !searchOpen; if(!searchOpen) searchQ = ''"
        class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
        :style="searchOpen
          ? { background: accent + '20', border: `1px solid ${accent}44` }
          : { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }">
        <Search :size="15" :style="{ color: searchOpen ? accent : '#a1a1aa' }" :stroke-width="2" />
      </button>
    </div>

    <!-- Search bar (animated) -->
    <Transition name="search-drop">
      <div v-if="searchOpen" class="flex items-center gap-2 mx-4 mb-4 rounded-2xl px-4 py-3"
        style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);">
        <Search :size="13" class="text-zinc-600 flex-shrink-0" :stroke-width="2" />
        <input
          ref="searchInput"
          v-model="searchQ"
          placeholder="search questions…"
          class="flex-1 bg-transparent text-[13px] font-mono text-zinc-200 placeholder:text-zinc-600 outline-none"
        />
        <button v-if="searchQ" @click="searchQ = ''" class="text-zinc-600 active:text-zinc-400">
          <X :size="12" :stroke-width="2.5" />
        </button>
      </div>
    </Transition>

    <!-- Category filter chips -->
    <div v-if="!searchQ" class="flex gap-2 px-4 mb-5 overflow-x-auto scrollbar-hide">
      <button
        v-for="cat in allCategories" :key="cat.id"
        @click="activeCategory = cat.id"
        class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
        :style="activeCategory === cat.id
          ? { background: cat.color + '20', border: `1px solid ${cat.color}44`, color: cat.color }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }">
        <span>{{ cat.icon }}</span>
        {{ cat.label }}
      </button>
    </div>

    <!-- No results -->
    <div v-if="visibleSections.length === 0" class="mx-4 flex flex-col items-center gap-3 py-16 rounded-2xl"
      style="border:2px dashed rgba(255,255,255,0.06);">
      <HelpCircle :size="32" class="text-zinc-700" :stroke-width="1.5" />
      <p class="text-[13px] font-mono text-zinc-600">no_results_found</p>
      <p class="text-[11px] font-mono text-zinc-700">Try different keywords</p>
    </div>

    <!-- FAQ Sections -->
    <div class="flex flex-col gap-5 px-4">
      <div v-for="section in visibleSections" :key="section.id">

        <!-- Section header -->
        <div class="flex items-center gap-2.5 mb-3">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[14px]"
            :style="{ background: section.color + '18', border: `1px solid ${section.color}28` }">
            {{ section.icon }}
          </div>
          <p class="text-[10px] font-mono font-bold uppercase tracking-widest"
            :style="{ color: section.color + 'AA' }">{{ section.label }}</p>
          <div class="flex-1 h-px" :style="{ background: section.color + '18' }"></div>
          <span class="text-[9px] font-mono text-zinc-700">{{ section.items.length }} questions</span>
        </div>

        <!-- FAQ items -->
        <div class="flex flex-col gap-2">
          <div
            v-for="(item, i) in section.items" :key="item.id"
            class="rounded-2xl overflow-hidden transition-all"
            :style="openIds.has(item.id)
              ? { background: section.color + '08', border: `1px solid ${section.color}28` }
              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }">

            <!-- Question row -->
            <button
              @click="toggleItem(item.id)"
              class="w-full flex items-start gap-3 px-4 py-3.5 text-left active:opacity-80 transition-opacity">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                :style="{ background: openIds.has(item.id) ? section.color + '20' : 'rgba(255,255,255,0.05)' }">
                <span class="text-[10px] font-black font-mono"
                  :style="{ color: openIds.has(item.id) ? section.color : '#52525b' }">
                  {{ String(i + 1).padStart(2, '0') }}
                </span>
              </div>
              <p class="flex-1 text-[13px] font-bold font-mono leading-snug"
                :class="openIds.has(item.id) ? 'text-zinc-100' : 'text-zinc-400'">
                {{ item.q }}
              </p>
              <div class="flex-shrink-0 mt-0.5 transition-transform duration-300"
                :class="openIds.has(item.id) ? 'rotate-45' : 'rotate-0'">
                <Plus :size="14"
                  :style="{ color: openIds.has(item.id) ? section.color : '#3f3f46' }"
                  :stroke-width="2.5" />
              </div>
            </button>

            <!-- Answer (animated) -->
            <Transition name="faq-answer">
              <div v-if="openIds.has(item.id)" class="px-4 pb-4">
                <div class="ml-9 border-l-2 pl-3.5"
                  :style="{ borderColor: section.color + '30' }">
                  <p class="text-[12px] font-mono text-zinc-400 leading-relaxed whitespace-pre-line">{{ item.a }}</p>
                  <!-- Optional code block -->
                  <div v-if="item.code" class="mt-3 rounded-xl px-3 py-2.5 overflow-x-auto"
                    style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);">
                    <pre class="text-[10px] font-mono text-emerald-400 leading-relaxed">{{ item.code }}</pre>
                  </div>
                  <!-- Optional tip badge -->
                  <div v-if="item.tip" class="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl"
                    :style="{ background: section.color + '10', border: `1px solid ${section.color}20` }">
                    <Lightbulb :size="12" :style="{ color: section.color }" :stroke-width="2" class="flex-shrink-0 mt-0.5" />
                    <p class="text-[11px] font-mono leading-relaxed" :style="{ color: section.color + 'BB' }">{{ item.tip }}</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mx-4 mt-6 mb-2 rounded-2xl px-5 py-5 flex items-center gap-4"
      :style="{ background: accent + '08', border: `1px solid ${accent}18` }">
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        :style="{ background: accent + '18', border: `1px solid ${accent}30` }">
        <MessageCircle :size="18" :style="{ color: accent }" :stroke-width="1.8" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[13px] font-black font-mono text-zinc-200">Still have questions?</p>
        <p class="text-[11px] font-mono text-zinc-600 mt-0.5">Check the Developer Tools for logs &amp; diagnostics.</p>
      </div>
      <button @click="navigate('developer')"
        class="flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all"
        :style="{ background: accent + '18', border: `1px solid ${accent}30`, color: accent }">
        open
      </button>
    </div>

    <div class="h-4"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ChevronLeft, Search, X, Plus, HelpCircle, Lightbulb, MessageCircle } from 'lucide-vue-next'
import { settings } from '../composables/useStore'
import { useNav } from '../composables/useNav'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)

// ── Search ────────────────────────────────────────────────
const searchOpen    = ref(false)
const searchQ       = ref('')
const searchInput   = ref<HTMLInputElement | null>(null)

watch(searchOpen, async (v) => {
  if (v) { await nextTick(); searchInput.value?.focus() }
})

// ── Categories ────────────────────────────────────────────
const activeCategory = ref('all')

const allCategories = [
  { id: 'all',      label: 'All',        icon: '✦',  color: '#a1a1aa' },
  { id: 'general',  label: 'General',    icon: '🌐',  color: '#60a5fa' },
  { id: 'daemon',   label: 'Daemon',     icon: '⚡',  color: '#34d399' },
  { id: 'env',      label: 'ENV',        icon: '📄',  color: '#fbbf24' },
  { id: 'security', label: 'Security',   icon: '🔐',  color: '#f87171' },
  { id: 'vibecode', label: 'Vibecode',   icon: '🧘',  color: '#c084fc' },
]

// ── Open/close accordion ──────────────────────────────────
const openIds = ref(new Set<string>())
function toggleItem(id: string) {
  if (openIds.value.has(id)) openIds.value.delete(id)
  else                        openIds.value.add(id)
  openIds.value = new Set(openIds.value) // trigger reactivity
}

// ── FAQ DATA ──────────────────────────────────────────────
interface FaqItem {
  id:   string
  q:    string
  a:    string
  code?: string
  tip?:  string
}
interface FaqSection {
  id:    string
  label: string
  icon:  string
  color: string
  items: FaqItem[]
}

const sections: FaqSection[] = [
  {
    id: 'general', label: 'General', icon: '🌐', color: '#60a5fa',
    items: [
      {
        id: 'g1',
        q: 'What is Orb DevKit?',
        a: 'Orb DevKit is a mobile developer toolkit that lets you manage ENV variables, store passwords securely, run focus sessions, and connect to a desktop daemon — all from your phone.\n\nThink of it as a developer\'s Swiss army knife that lives in your pocket.',
        tip: 'Enable Dev Mode from the dashboard orb to unlock daemon connections and extended logging.',
      },
      {
        id: 'g2',
        q: 'What is Dev Mode and when should I use it?',
        a: 'Dev Mode unlocks daemon connections, extended logging, and the device monitor. It\'s designed for active development sessions.\n\nTurn it off when you\'re done to save battery and prevent accidental daemon connections.',
      },
      {
        id: 'g3',
        q: 'Does Orb DevKit store my data in the cloud?',
        a: 'No. All data is stored locally on your device using localStorage and (on native) SQLite. Nothing leaves your device unless you explicitly sync to a paired daemon on your local network.',
      },
      {
        id: 'g4',
        q: 'How do I change the accent color or theme?',
        a: 'Go to Settings → Appearance → Accent Color. You can pick from 12 preset colors or enter a custom hex code.\n\nFor dark/light mode, use Settings → Appearance → Theme.',
      },
      {
        id: 'g5',
        q: 'What is the maximum number of devices I can connect?',
        a: 'By default, Orb DevKit allows up to 3 simultaneous daemon connections. You can change this limit in Settings → Connections → Max Connected Devices.\n\nThe limit can be set between 1 and 10 devices.',
        tip: 'Each paired device counts against the limit only when actively connected, not when offline.',
      },
    ],
  },
  {
    id: 'daemon', label: 'Daemon & Connections', icon: '⚡', color: '#34d399',
    items: [
      {
        id: 'd1',
        q: 'What is the Orb daemon?',
        a: 'The daemon is a small Rust binary that runs on your desktop (Mac, Linux, Windows). It creates a secure local WebSocket server that your phone connects to over WiFi.\n\nThis lets the REPL on your desktop browse your phone\'s ENV vars, vault, and other data on demand.',
      },
      {
        id: 'd2',
        q: 'How do I install and start the daemon?',
        a: 'Build from source with Cargo, then run:',
        code: 'cargo build --release\n./target/release/orb-daemon start',
        tip: 'Add the binary to your PATH so you can run it from anywhere.',
      },
      {
        id: 'd3',
        q: 'How do I pair my phone with the desktop daemon?',
        a: '1. On your desktop, run: orb-daemon pair\n2. A QR code appears in your terminal\n3. In the app, go to Devices → Pair Desktop\n4. Tap "Scan QR Code" and point your camera at the terminal\n5. The app and daemon exchange a one-time token and establish a secure connection',
        tip: 'The pairing token expires in 5 minutes. If it expires, run orb-daemon pair again.',
      },
      {
        id: 'd4',
        q: 'The app shows "daemon · offline" — what\'s wrong?',
        a: 'Common causes:\n\n• orb-daemon isn\'t running on your desktop\n• Your phone and PC are on different WiFi networks\n• A firewall is blocking port 3132\n• Dev Mode is turned off in the app\n\nTry: Settings → Advanced → Reset Daemon Pairing, then re-pair.',
      },
      {
        id: 'd5',
        q: 'What is the REPL and how do I use it?',
        a: 'When the daemon starts, it opens an interactive terminal REPL. Once your phone is connected, type commands to browse your phone\'s data live:',
        code: 'orb> ls              # overview of all data\norb> env             # list ENV projects\norb> env myapp dev   # list variables\norb> vault           # list vault entries\norb> prompts         # list AI prompts\norb> help            # all commands',
      },
      {
        id: 'd6',
        q: 'Is the daemon connection encrypted?',
        a: 'The daemon listens on two ports:\n\n• Port 3131 — TLS (raw TCP + WSS) for native clients\n• Port 3132 — Plain WebSocket for the mobile app\n\nThe pairing handshake uses a one-time token. All env var sync and vault operations go over the local network only.',
        tip: 'Never expose port 3132 to the internet. It\'s designed for LAN use only.',
      },
    ],
  },
  {
    id: 'env', label: 'ENV Manager', icon: '📄', color: '#fbbf24',
    items: [
      {
        id: 'e1',
        q: 'How is the ENV manager organized?',
        a: 'Projects → Environments → Variables.\n\nA Project represents an app or codebase (e.g. "my-api"). Each project has Environments (dev, staging, prod, or custom). Each environment holds key-value variables.',
      },
      {
        id: 'e2',
        q: 'What are custom environment types?',
        a: 'Beyond the six presets (dev, qa, staging, prod, local, ci/cd), you can define any type you want: canary, feature-branch, hotfix, etc.\n\nCustom types use your accent color and a pencil icon to visually distinguish them.',
      },
      {
        id: 'e3',
        q: 'How does the ENV lock work?',
        a: 'The ENV manager shares the same master password as your credential vault. Set it once in either place and it unlocks both.\n\nThe password is hashed with SHA-256 and stored locally — it never leaves your device.',
      },
      {
        id: 'e4',
        q: 'How do I export ENV variables to a .env file?',
        a: 'Navigate to a project → environment → tap the ".env" button in the top-right. This copies all variables in KEY=VALUE format to your clipboard, ready to paste into any .env file.',
        code: 'DATABASE_URL=postgres://localhost/mydb\nAPI_KEY=sk-abc123\nNODE_ENV=development',
      },
      {
        id: 'e5',
        q: 'How does daemon sync work for ENV vars?',
        a: 'When connected, any time you add, edit, or delete a variable, it\'s automatically pushed to the daemon. The daemon writes a .env file to:\n\n~/.orb/envs/<project>/<environment>.env\n\nYou can source this file in your shell or read it with dotenv.',
      },
    ],
  },
  {
    id: 'security', label: 'Security & Vault', icon: '🔐', color: '#f87171',
    items: [
      {
        id: 's1',
        q: 'How are passwords stored?',
        a: 'Vault entries are stored in localStorage on your device. The vault requires a master password to unlock — this password is hashed with SHA-256 before being stored.\n\nPasswords themselves are stored in plaintext inside the locked vault. The vault lock prevents unauthorized reading.',
        tip: 'Enable App PIN (Settings → Security) for an extra layer of protection when someone has physical access to your device.',
      },
      {
        id: 's2',
        q: 'What is the App PIN?',
        a: 'A 6-digit PIN that locks the entire app on launch or after idle. Set it in Settings → Security → App PIN.\n\nYou\'ll also set a security question (e.g. "What was your first pet\'s name?") that lets you reset a forgotten PIN.',
      },
      {
        id: 's3',
        q: 'What is Idle Screen Lock?',
        a: 'If enabled, the app blurs and locks after a period of inactivity (1–60 minutes, configurable). Tap "Resume Session" to unlock without re-entering the PIN.\n\nThis is different from the App PIN — idle lock is a soft lock, PIN is a hard lock on app launch.',
      },
      {
        id: 's4',
        q: 'Are vault passwords sent to the daemon?',
        a: 'No. When the daemon REPL runs "vault", it only receives service names, usernames, and metadata. Passwords are explicitly redacted before transmission and replaced with a placeholder string.',
        tip: 'This is by design. The daemon can help you browse metadata, but credential secrets stay on your device.',
      },
      {
        id: 's5',
        q: 'How do I export and import a backup?',
        a: 'Settings → Data → Export Data. You\'ll set an encryption password — the entire backup is AES-256-GCM encrypted before download.\n\nTo restore: Settings → Data → Import Data. You need the same password used during export.',
      },
    ],
  },
  {
    id: 'vibecode', label: 'Vibecode Therapy', icon: '🧘', color: '#c084fc',
    items: [
      {
        id: 'v1',
        q: 'What is Vibecode Therapy?',
        a: 'A focus session timer that optionally blocks AI coding assistants (ChatGPT, Claude, Cursor, etc.) during your session — forcing you to think through problems yourself.\n\nSessions are 25–90 minutes. Your history and streak are tracked.',
      },
      {
        id: 'v2',
        q: 'How does the AI blocklist actually work?',
        a: 'When connected to the daemon, the blocklist is synced to your desktop as a hosts-file snippet at:\n\n~/.orb/blocklist/blocked.hosts\n\nYou need to include this file in your system hosts or use a DNS tool to enforce the blocks. The app itself cannot block network access on iOS/Android without a VPN profile.',
        tip: 'On macOS, add "include ~/.orb/blocklist/blocked.hosts" to /etc/hosts to activate blocking.',
      },
      {
        id: 'v3',
        q: 'What happens if I stop a session early?',
        a: 'Stopping early does not log a completed session. Only sessions that run to completion (the timer reaches 00:00) are recorded in history and count toward your streak.',
      },
      {
        id: 'v4',
        q: 'How is the streak calculated?',
        a: 'A streak counts consecutive calendar days with at least one completed session. The streak counter checks backward from today — if you didn\'t complete a session yesterday, your streak resets to 0.',
      },
    ],
  },
]

// ── Filtering ─────────────────────────────────────────────
const visibleSections = computed((): FaqSection[] => {
  if (searchQ.value.trim()) {
    const q = searchQ.value.toLowerCase()
    return sections
      .map(s => ({
        ...s,
        items: s.items.filter(i =>
          i.q.toLowerCase().includes(q) ||
          i.a.toLowerCase().includes(q) ||
          (i.tip ?? '').toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.items.length > 0)
  }
  if (activeCategory.value === 'all') return sections
  return sections.filter(s => s.id === activeCategory.value)
})
</script>

<style scoped>
.devkit-root { background: #060810; min-height: 100%; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Search bar drop */
.search-drop-enter-active { transition: all 0.22s cubic-bezier(0.34,1.1,0.64,1); }
.search-drop-leave-active { transition: all 0.16s ease; }
.search-drop-enter-from   { opacity: 0; transform: translateY(-8px) scaleY(0.92); }
.search-drop-leave-to     { opacity: 0; transform: translateY(-4px) scaleY(0.96); }

/* FAQ answer accordion */
.faq-answer-enter-active { transition: all 0.28s cubic-bezier(0.34,1.1,0.64,1); overflow: hidden; }
.faq-answer-leave-active { transition: all 0.18s ease; overflow: hidden; }
.faq-answer-enter-from   { opacity: 0; max-height: 0; }
.faq-answer-enter-to     { opacity: 1; max-height: 600px; }
.faq-answer-leave-from   { opacity: 1; max-height: 600px; }
.faq-answer-leave-to     { opacity: 0; max-height: 0; }
</style>