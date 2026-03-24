<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- ══ HEADER ══ -->
    <div class="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / env_manager</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span>
          <span v-if="!activeProject"> .env</span>
          <span v-else-if="!activeInstance"> {{ activeProject.name }}</span>
          <span v-else> {{ activeProject.name }}<span class="text-zinc-600">/</span>{{ activeInstance.name }}</span>
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- TCP sync badge -->
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          :style="{ background: tcpConnected ? '#10b98118' : '#ef444418', border: `1px solid ${tcpConnected ? '#10b98133' : '#ef444433'}` }">
          <div :class="['w-1.5 h-1.5 rounded-full', tcpConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500']"></div>
          <span class="text-[10px] font-mono font-bold" :style="{ color: tcpConnected ? '#34d399' : '#f87171' }">
            {{ tcpConnected ? 'SYNCED' : 'OFFLINE' }}
          </span>
        </div>
        <!-- Add button — context aware -->
        <button @click="onAddClick"
          class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
          <Plus :size="17" class="text-zinc-300" :stroke-width="2" />
        </button>
      </div>
    </div>

    <!-- ══ BREADCRUMB ══ -->
    <div v-if="activeProject" class="flex items-center gap-1.5 px-5 mb-3">
      <button @click="goHome" class="text-[11px] font-mono font-bold text-zinc-600 active:text-zinc-400 transition-colors">
        .env
      </button>
      <ChevronRight :size="11" class="text-zinc-700" :stroke-width="2" />
      <button @click="goToProject" :class="['text-[11px] font-mono font-bold transition-colors', !activeInstance ? 'text-zinc-300' : 'text-zinc-600 active:text-zinc-400']">
        {{ activeProject.name }}
      </button>
      <template v-if="activeInstance">
        <ChevronRight :size="11" class="text-zinc-700" :stroke-width="2" />
        <span class="text-[11px] font-mono font-bold" :style="{ color: instanceColor(activeInstance.type) }">
          {{ activeInstance.name }}
        </span>
      </template>
    </div>

    <!-- ══════════════════════════════════════════
         LEVEL 0 — PROJECT LIST
    ══════════════════════════════════════════ -->
    <template v-if="!activeProject">
      <!-- Empty state -->
      <div v-if="!projects.length" class="mx-4 mb-4 rounded-2xl flex flex-col items-center gap-4 py-14"
        style="border:2px dashed rgba(255,255,255,0.06);">
        <FolderOpen :size="32" class="text-zinc-700" :stroke-width="1.5" />
        <div class="text-center">
          <p class="text-[13px] font-mono font-bold text-zinc-500">no_projects_yet</p>
          <p class="text-[11px] font-mono text-zinc-700 mt-1">Create a project to start managing env vars</p>
        </div>
        <button @click="showProjectSheet = true"
          class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-mono font-bold active:scale-95 transition-all"
          :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
          <Plus :size="13" :stroke-width="2.5" /> new_project
        </button>
      </div>

      <!-- Project cards -->
      <div class="flex flex-col gap-2.5 px-4">
        <button v-for="proj in projects" :key="proj.id"
          @click="activeProjectId = proj.id"
          class="rounded-2xl overflow-hidden active:scale-[0.99] transition-all text-left"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
          <div class="flex items-center gap-3 px-4 py-4">
            <!-- Project icon -->
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-[20px]"
              :style="{ background: proj.color + '14', border: `1px solid ${proj.color}25` }">
              {{ proj.icon }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-black font-mono text-zinc-100">{{ proj.name }}</p>
              <p class="text-[11px] font-mono text-zinc-500 mt-0.5 truncate">{{ proj.description || 'No description' }}</p>
            </div>
            <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
              <!-- Instance chips -->
              <div class="flex gap-1">
                <span v-for="inst in proj.instances" :key="inst.id"
                  class="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                  :style="{ background: instanceColor(inst.type) + '18', color: instanceColor(inst.type) + 'CC', border: `1px solid ${instanceColor(inst.type)}25` }">
                  {{ inst.name }}
                </span>
              </div>
              <span class="text-[9px] font-mono text-zinc-600">
                {{ totalVarCount(proj) }} vars
              </span>
            </div>
          </div>
        </button>
      </div>
    </template>

    <!-- ══════════════════════════════════════════
         LEVEL 1 — INSTANCE LIST (inside a project)
    ══════════════════════════════════════════ -->
    <template v-else-if="activeProject && !activeInstance">

      <!-- Project metadata -->
      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        :style="{ background: activeProject.color + '08', border: `1px solid ${activeProject.color}20` }">
        <div class="flex items-center gap-3 px-4 py-3.5">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-[20px]"
            :style="{ background: activeProject.color + '18', border: `1px solid ${activeProject.color}30` }">
            {{ activeProject.icon }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-black font-mono" :style="{ color: activeProject.color }">{{ activeProject.name }}</p>
            <p class="text-[11px] font-mono text-zinc-500 mt-0.5 truncate">{{ activeProject.description || 'No description' }}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button @click="editProject(activeProject)"
              class="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
              <Pencil :size="13" class="text-zinc-500" :stroke-width="2" />
            </button>
            <button @click="confirmDeleteProject(activeProject.id)"
              class="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all"
              style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);">
              <Trash2 :size="13" class="text-rose-500" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>

      <!-- Section header -->
      <div class="flex items-center justify-between px-5 pb-2">
        <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">environments</p>
        <button @click="showInstanceSheet = true; instanceForm.projectId = activeProject.id"
          class="text-[10px] font-mono font-bold flex items-center gap-1 active:opacity-60"
          :style="{ color: accent }">
          <Plus :size="11" :stroke-width="2.5" /> add
        </button>
      </div>

      <!-- Empty instances -->
      <div v-if="!activeProject.instances.length" class="mx-4 rounded-2xl flex flex-col items-center gap-3 py-10"
        style="border:2px dashed rgba(255,255,255,0.06);">
        <Layers :size="24" class="text-zinc-700" :stroke-width="1.5" />
        <p class="text-[12px] font-mono text-zinc-600">no_environments_yet</p>
        <button @click="showInstanceSheet = true; instanceForm.projectId = activeProject.id"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all"
          :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
          <Plus :size="12" :stroke-width="2.5" /> add_environment
        </button>
      </div>

      <!-- Instance cards -->
      <div class="flex flex-col gap-2.5 px-4">
        <button v-for="inst in activeProject.instances" :key="inst.id"
          @click="activeInstanceId = inst.id"
          class="rounded-2xl overflow-hidden active:scale-[0.99] transition-all text-left"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
          <div class="flex items-center gap-3 px-4 py-4">
            <!-- Type badge -->
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              :style="{ background: instanceColor(inst.type) + '14', border: `1px solid ${instanceColor(inst.type)}28` }">
              <component :is="instanceIcon(inst.type)" :size="20"
                :style="{ color: instanceColor(inst.type) }" :stroke-width="1.8" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-[15px] font-black font-mono text-zinc-100">{{ inst.name }}</p>
                <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                  :style="{ background: instanceColor(inst.type) + '18', color: instanceColor(inst.type), border: `1px solid ${instanceColor(inst.type)}30` }">
                  {{ inst.type }}
                </span>
              </div>
              <p class="text-[11px] font-mono text-zinc-500 mt-0.5">{{ inst.vars.length }} variables</p>
            </div>
            <ChevronRight :size="15" class="text-zinc-700 flex-shrink-0" :stroke-width="2" />
          </div>
        </button>
      </div>
    </template>

    <!-- ══════════════════════════════════════════
         LEVEL 2 — VARIABLES (inside a project+instance)
    ══════════════════════════════════════════ -->
    <template v-else-if="activeProject && activeInstance">

      <!-- Instance info bar -->
      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        :style="{ background: instanceColor(activeInstance.type) + '08', border: `1px solid ${instanceColor(activeInstance.type)}22` }">
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="{ background: instanceColor(activeInstance.type) + '18', border: `1px solid ${instanceColor(activeInstance.type)}33` }">
            <component :is="instanceIcon(activeInstance.type)" :size="17"
              :style="{ color: instanceColor(activeInstance.type) }" :stroke-width="1.8" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-black font-mono" :style="{ color: instanceColor(activeInstance.type) }">
              {{ activeInstance.name }}
            </p>
            <p class="text-[10px] font-mono text-zinc-600 mt-0.5">{{ activeInstance.vars.length }} variables</p>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button @click="editInstance(activeInstance)"
              class="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
              <Pencil :size="13" class="text-zinc-500" :stroke-width="2" />
            </button>
            <button @click="exportDotEnv"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold active:scale-95 transition-all flex-shrink-0"
              :style="{ background: accent + '14', border: `1px solid ${accent}25`, color: accent }">
              <FileDown :size="11" :stroke-width="2" /> .env
            </button>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="flex items-center gap-2 px-4 mb-3">
        <div class="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
          <Search :size="13" class="text-zinc-600 flex-shrink-0" :stroke-width="2" />
          <input v-model="varSearch" placeholder="search vars…"
            class="flex-1 bg-transparent text-[12px] font-mono text-zinc-200 placeholder:text-zinc-700 outline-none" />
          <button v-if="varSearch" @click="varSearch = ''" class="text-zinc-700 active:text-zinc-500">
            <X :size="11" :stroke-width="2.5" />
          </button>
        </div>
        <!-- Type filter chips -->
        <div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button v-for="t in ['all', ...varTypes.map(v => v.value)]" :key="t"
            @click="varTypeFilter = t"
            class="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all"
            :style="varTypeFilter === t
              ? { background: accent + '20', border: `1px solid ${accent}44`, color: accent }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }">
            {{ t }}
          </button>
        </div>
      </div>

      <!-- Empty vars -->
      <div v-if="!filteredVars.length" class="mx-4 rounded-2xl flex flex-col items-center gap-3 py-10"
        style="border:2px dashed rgba(255,255,255,0.06);">
        <FileCode :size="28" class="text-zinc-700" :stroke-width="1.5" />
        <p class="text-[13px] font-mono text-zinc-600">{{ varSearch ? 'no_results_found' : 'no_vars_yet' }}</p>
        <button @click="openAddVar"
          class="flex items-center gap-1.5 text-[11px] font-mono font-bold px-4 py-2 rounded-xl active:scale-95 transition-all"
          :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
          <Plus :size="12" :stroke-width="2.5" /> add_var
        </button>
      </div>

      <!-- Vars list -->
      <div v-else class="mx-4 rounded-2xl overflow-hidden"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <div v-for="(v, i) in filteredVars" :key="v.id"
          :class="['flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/5',
            i < filteredVars.length - 1 ? 'border-b border-white/5' : '']">
          <!-- Type icon -->
          <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            :style="{ background: accent + '12', border: `1px solid ${accent}20` }">
            <component :is="typeIcon(v.type)" :size="13" :style="{ color: accent + 'CC' }" :stroke-width="2" />
          </div>
          <!-- Key + value -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-[12px] font-mono font-bold text-zinc-200 truncate">{{ v.key }}</p>
              <span v-if="v.secret" class="text-[8px] font-mono text-amber-500 flex-shrink-0">🔒</span>
            </div>
            <p class="text-[10px] font-mono mt-0.5 truncate"
              :style="{ color: v.secret && !revealedVarIds.has(v.id) ? '#3f3f46' : accent + '88' }">
              {{ v.secret && !revealedVarIds.has(v.id) ? '••••••••••••••••' : v.value || '(empty)' }}
            </p>
          </div>
          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button v-if="v.secret" @click="toggleVarReveal(v.id)"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
              style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);">
              <Eye v-if="!revealedVarIds.has(v.id)" :size="12" style="color:#fbbf24" :stroke-width="2" />
              <EyeOff v-else :size="12" style="color:#fbbf24" :stroke-width="2" />
            </button>
            <button @click="copyVar(v)"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
              <Copy :size="11" class="text-zinc-600" :stroke-width="2" />
            </button>
            <button @click="editVar(v)"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
              :style="{ background: accent + '10', border: `1px solid ${accent}20` }">
              <Pencil :size="11" :style="{ color: accent + 'CC' }" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>

      <!-- Export row -->
      <div class="mx-4 mt-3 rounded-2xl overflow-hidden"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
        <button @click="exportJson"
          class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style="background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.20);">
            <Braces :size="15" style="color:#818cf8" :stroke-width="1.8" />
          </div>
          <p class="text-[13px] font-mono font-bold text-zinc-400 flex-1 text-left">Copy as JSON</p>
          <ArrowRight :size="13" class="text-zinc-700" :stroke-width="2" />
        </button>
      </div>
    </template>

    <div class="h-4"></div>
  </div>

  <!-- ══ PROJECT SHEET ══ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showProjectSheet"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(14px)"
        @click.self="closeProjectSheet">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t overflow-hidden"
          style="background:#0c0c18;border-color:rgba(255,255,255,0.08);"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4">
            <div class="w-10 h-1 rounded-full self-center mb-1" style="background:rgba(255,255,255,0.08)"></div>
            <p class="text-[16px] font-black font-mono text-center text-zinc-100">
              {{ editProjectTarget ? 'edit_project' : 'new_project' }}
            </p>

            <!-- Icon + Color row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">ICON</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="ic in projectIcons" :key="ic" @click="projectForm.icon = ic"
                    class="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] transition-all active:scale-90"
                    :style="projectForm.icon === ic
                      ? { background: accent + '20', border: `1px solid ${accent}44` }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }">
                    {{ ic }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">COLOR</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="col in projectColors" :key="col" @click="projectForm.color = col"
                    class="w-7 h-7 rounded-full transition-all active:scale-90"
                    :style="{ background: col, boxShadow: projectForm.color === col ? `0 0 0 2px #0c0c18, 0 0 0 4px ${col}` : 'none' }">
                  </button>
                </div>
              </div>
            </div>

            <!-- Name -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">PROJECT NAME</p>
              <input v-model="projectForm.name" placeholder="my-app"
                class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <!-- Description -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">DESCRIPTION (optional)</p>
              <input v-model="projectForm.description" placeholder="Short description…"
                class="w-full rounded-xl px-4 py-3 text-[13px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <div class="flex gap-2 mt-1">
              <button v-if="editProjectTarget" @click="deleteProjectConfirmed"
                class="w-10 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95"
                style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
                <Trash2 :size="16" class="text-rose-500" :stroke-width="2" />
              </button>
              <button @click="saveProject" :disabled="!projectForm.name.trim()"
                class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
                :style="projectForm.name.trim()
                  ? { background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }
                  : { background: 'rgba(255,255,255,0.05)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)' }">
                {{ editProjectTarget ? 'save_changes' : 'create_project' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ INSTANCE SHEET ══ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showInstanceSheet"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(14px)"
        @click.self="closeInstanceSheet">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t overflow-hidden"
          style="background:#0c0c18;border-color:rgba(255,255,255,0.08);"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4">
            <div class="w-10 h-1 rounded-full self-center mb-1" style="background:rgba(255,255,255,0.08)"></div>
            <p class="text-[16px] font-black font-mono text-center text-zinc-100">
              {{ editInstanceTarget ? 'edit_environment' : 'new_environment' }}
            </p>

            <!-- Type selector -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">ENVIRONMENT TYPE</p>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="t in instanceTypes" :key="t.value" @click="instanceForm.type = t.value"
                  class="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                  :style="instanceForm.type === t.value
                    ? { background: instanceColor(t.value) + '18', border: `1px solid ${instanceColor(t.value)}44` }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }">
                  <component :is="instanceIcon(t.value)" :size="18"
                    :style="{ color: instanceForm.type === t.value ? instanceColor(t.value) : '#52525b' }"
                    :stroke-width="1.8" />
                  <span class="text-[10px] font-mono font-bold"
                    :style="{ color: instanceForm.type === t.value ? instanceColor(t.value) : '#52525b' }">
                    {{ t.label }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Name -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">NAME</p>
              <input v-model="instanceForm.name" :placeholder="instanceForm.type || 'dev'"
                class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <div class="flex gap-2 mt-1">
              <button v-if="editInstanceTarget" @click="deleteInstance(editInstanceTarget.id)"
                class="w-10 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95"
                style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
                <Trash2 :size="16" class="text-rose-500" :stroke-width="2" />
              </button>
              <button @click="saveInstance" :disabled="!instanceForm.name.trim()"
                class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
                :style="instanceForm.name.trim()
                  ? { background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }
                  : { background: 'rgba(255,255,255,0.05)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)' }">
                {{ editInstanceTarget ? 'save_changes' : 'add_environment' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ VAR SHEET ══ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showVarSheet"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(14px)"
        @click.self="closeVarSheet">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t overflow-hidden"
          style="background:#0c0c18;border-color:rgba(255,255,255,0.08);"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4">
            <div class="w-10 h-1 rounded-full self-center mb-1" style="background:rgba(255,255,255,0.08)"></div>
            <p class="text-[16px] font-black font-mono text-center text-zinc-100">
              {{ editVarTarget ? 'edit_var' : 'new_var' }}
            </p>

            <!-- KEY -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">KEY</p>
              <input v-model="varForm.key" placeholder="VARIABLE_NAME"
                class="w-full rounded-xl px-4 py-3 text-[13px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);"
                @input="varForm.key = varForm.key.toUpperCase().replace(/[^A-Z0-9_]/g,'_')" />
            </div>

            <!-- VALUE -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">VALUE</p>
              <div class="flex items-center gap-2 rounded-xl px-4 py-3"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
                <input v-model="varForm.value"
                  :type="varForm.secret && !varForm.revealInForm ? 'password' : 'text'"
                  placeholder="your_value_here"
                  class="flex-1 bg-transparent text-[13px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none" />
                <button v-if="varForm.secret" @click="varForm.revealInForm = !varForm.revealInForm"
                  class="flex-shrink-0 active:opacity-60">
                  <Eye v-if="!varForm.revealInForm" :size="14" class="text-amber-500" :stroke-width="2" />
                  <EyeOff v-else :size="14" class="text-amber-500" :stroke-width="2" />
                </button>
              </div>
            </div>

            <!-- TYPE -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">TYPE</p>
              <div class="flex gap-2 flex-wrap">
                <button v-for="t in varTypes" :key="t.value" @click="varForm.type = t.value"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
                  :style="varForm.type === t.value
                    ? { background: accent + '18', border: `1px solid ${accent}33`, color: accent }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }">
                  <component :is="t.icon" :size="11" :stroke-width="2" />{{ t.label }}
                </button>
              </div>
            </div>

            <!-- SECRET toggle -->
            <button @click="varForm.secret = !varForm.secret"
              :class="['flex items-center gap-3 px-4 py-3 rounded-xl border transition-all']"
              :style="varForm.secret
                ? { background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)' }
                : { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }">
              <Lock :size="15" :class="varForm.secret ? 'text-amber-400' : 'text-zinc-700'" :stroke-width="2" />
              <div class="flex-1 text-left">
                <p class="text-[12px] font-mono font-bold" :class="varForm.secret ? 'text-amber-300' : 'text-zinc-500'">
                  Mark as secret
                </p>
              </div>
              <div :class="['w-10 h-5 rounded-full transition-all relative flex-shrink-0',
                varForm.secret ? 'bg-amber-500' : 'bg-zinc-800']">
                <div :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                  varForm.secret ? 'left-5' : 'left-0.5']"></div>
              </div>
            </button>

            <div class="flex gap-2 mt-1">
              <button v-if="editVarTarget" @click="deleteVar(editVarTarget.id)"
                class="w-10 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95"
                style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
                <Trash2 :size="16" class="text-rose-500" :stroke-width="2" />
              </button>
              <button @click="saveVar" :disabled="!varForm.key.trim()"
                class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
                :style="varForm.key.trim()
                  ? { background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }
                  : { background: 'rgba(255,255,255,0.05)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)' }">
                {{ editVarTarget ? 'save_changes' : 'add_var' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ TOAST ══ -->
  <Transition name="toast">
    <div v-if="toastMsg"
      class="fixed left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 px-4 py-2.5 rounded-xl"
      style="top:calc(16px + env(safe-area-inset-top));background:rgba(12,12,24,0.95);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(20px);">
      <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
      <p class="text-[12px] font-mono font-bold text-zinc-200">{{ toastMsg }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  Plus, Search, X, Eye, EyeOff, Copy, Pencil, Trash2, Lock,
  FileDown, ArrowRight, Braces, FileCode, FolderOpen, ChevronRight,
  Layers, Link, Hash, ToggleLeft, AlignLeft, FlaskConical,
  Server, Globe, HardDrive, Shield,
} from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'
import { tcpConnected } from '../composables/useTcp'

const accent = computed(() => settings.value.accentColor)

// ══════════════════════════════════════════════════════════
// DATA STRUCTURES
// ══════════════════════════════════════════════════════════

interface EnvVar {
  id:       string
  key:      string
  value:    string
  type:     string
  secret:   boolean
}

interface EnvInstance {
  id:   string
  name: string
  type: string   // dev | qa | staging | prod | custom
  vars: EnvVar[]
}

interface EnvProject {
  id:          string
  name:        string
  description: string
  icon:        string
  color:       string
  instances:   EnvInstance[]
  createdAt:   string
}

// ══════════════════════════════════════════════════════════
// PERSISTENCE
// ══════════════════════════════════════════════════════════

const ENV_PROJECTS_KEY = 'orb_env_projects_v2'

function loadProjects(): EnvProject[] {
  try {
    const r = localStorage.getItem(ENV_PROJECTS_KEY)
    if (r) return JSON.parse(r)
  } catch {}
  return []
}

function saveProjects() {
  try { localStorage.setItem(ENV_PROJECTS_KEY, JSON.stringify(projects.value)) } catch {}
}

// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════

const projects        = ref<EnvProject[]>(loadProjects())
const activeProjectId  = ref<string | null>(null)
const activeInstanceId = ref<string | null>(null)

const activeProject  = computed(() => projects.value.find(p => p.id === activeProjectId.value) ?? null)
const activeInstance = computed(() => activeProject.value?.instances.find(i => i.id === activeInstanceId.value) ?? null)

function goHome() {
  activeProjectId.value  = null
  activeInstanceId.value = null
}

function goToProject() {
  activeInstanceId.value = null
}

// ══════════════════════════════════════════════════════════
// STATIC CONFIG
// ══════════════════════════════════════════════════════════

const projectIcons = ['🚀', '🌐', '📦', '🔧', '⚡', '🎯', '💎', '🔮', '🛠️', '📱']
const projectColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#f97316']

const instanceTypes = [
  { value: 'dev',     label: 'dev'     },
  { value: 'qa',      label: 'qa'      },
  { value: 'staging', label: 'staging' },
  { value: 'prod',    label: 'prod'    },
  { value: 'local',   label: 'local'   },
  { value: 'ci',      label: 'ci/cd'   },
]

function instanceColor(type: string): string {
  const map: Record<string, string> = {
    dev:     '#34d399',
    qa:      '#60a5fa',
    staging: '#fb923c',
    prod:    '#f87171',
    local:   '#a78bfa',
    ci:      '#fbbf24',
  }
  return map[type] ?? '#8b5cf6'
}

function instanceIcon(type: string) {
  const map: Record<string, any> = {
    dev:     FlaskConical,
    qa:      Shield,
    staging: Server,
    prod:    Globe,
    local:   HardDrive,
    ci:      Layers,
  }
  return map[type] ?? Layers
}

const varTypes = [
  { value: 'string', label: 'string', icon: AlignLeft  },
  { value: 'url',    label: 'url',    icon: Link        },
  { value: 'number', label: 'number', icon: Hash        },
  { value: 'bool',   label: 'bool',   icon: ToggleLeft  },
]

function typeIcon(type: string) {
  return varTypes.find(t => t.value === type)?.icon ?? AlignLeft
}

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function totalVarCount(proj: EnvProject): number {
  return proj.instances.reduce((s, i) => s + i.vars.length, 0)
}

// ══════════════════════════════════════════════════════════
// PROJECT CRUD
// ══════════════════════════════════════════════════════════

const showProjectSheet   = ref(false)
const editProjectTarget  = ref<EnvProject | null>(null)

const projectForm = reactive({
  name: '', description: '', icon: '🚀', color: '#8b5cf6',
})

function onAddClick() {
  if (!activeProject.value) {
    showProjectSheet.value = true
  } else if (!activeInstance.value) {
    showInstanceSheet.value = true
    instanceForm.projectId  = activeProject.value.id
  } else {
    openAddVar()
  }
}

function editProject(proj: EnvProject) {
  editProjectTarget.value  = proj
  projectForm.name         = proj.name
  projectForm.description  = proj.description
  projectForm.icon         = proj.icon
  projectForm.color        = proj.color
  showProjectSheet.value   = true
}

function closeProjectSheet() {
  showProjectSheet.value  = false
  editProjectTarget.value = null
  Object.assign(projectForm, { name: '', description: '', icon: '🚀', color: '#8b5cf6' })
}

function saveProject() {
  if (!projectForm.name.trim()) return
  if (editProjectTarget.value) {
    const p = projects.value.find(p => p.id === editProjectTarget.value!.id)
    if (p) {
      p.name        = projectForm.name.trim()
      p.description = projectForm.description.trim()
      p.icon        = projectForm.icon
      p.color       = projectForm.color
    }
    orbLog(`Project updated: ${projectForm.name}`)
  } else {
    projects.value.push({
      id:          uid(),
      name:        projectForm.name.trim(),
      description: projectForm.description.trim(),
      icon:        projectForm.icon,
      color:       projectForm.color,
      instances:   [],
      createdAt:   new Date().toISOString(),
    })
    orbLog(`Project created: ${projectForm.name}`)
  }
  saveProjects()
  closeProjectSheet()
  showToast(editProjectTarget.value ? 'project_updated' : 'project_created')
}

function confirmDeleteProject(id: string) {
  // inline: just delete
  projects.value = projects.value.filter(p => p.id !== id)
  if (activeProjectId.value === id) activeProjectId.value = null
  saveProjects()
  showToast('project_deleted')
  closeProjectSheet()
}

function deleteProjectConfirmed() {
  if (!editProjectTarget.value) return
  confirmDeleteProject(editProjectTarget.value.id)
}

// ══════════════════════════════════════════════════════════
// INSTANCE CRUD
// ══════════════════════════════════════════════════════════

const showInstanceSheet  = ref(false)
const editInstanceTarget = ref<EnvInstance | null>(null)

const instanceForm = reactive({
  projectId: '',
  name:      '',
  type:      'dev',
})

function editInstance(inst: EnvInstance) {
  editInstanceTarget.value = inst
  instanceForm.name        = inst.name
  instanceForm.type        = inst.type
  instanceForm.projectId   = activeProjectId.value ?? ''
  showInstanceSheet.value  = true
}

function closeInstanceSheet() {
  showInstanceSheet.value  = false
  editInstanceTarget.value = null
  Object.assign(instanceForm, { projectId: '', name: '', type: 'dev' })
}

function saveInstance() {
  if (!instanceForm.name.trim()) return
  const proj = projects.value.find(p => p.id === (instanceForm.projectId || activeProjectId.value))
  if (!proj) return

  if (editInstanceTarget.value) {
    const inst = proj.instances.find(i => i.id === editInstanceTarget.value!.id)
    if (inst) { inst.name = instanceForm.name.trim(); inst.type = instanceForm.type }
    orbLog(`Instance updated: ${instanceForm.name}`)
  } else {
    proj.instances.push({
      id:   uid(),
      name: instanceForm.name.trim(),
      type: instanceForm.type,
      vars: [],
    })
    orbLog(`Instance created: ${instanceForm.name} in ${proj.name}`)
  }
  saveProjects()
  closeInstanceSheet()
  showToast(editInstanceTarget.value ? 'environment_updated' : 'environment_added')
}

function deleteInstance(id: string) {
  const proj = projects.value.find(p => p.id === activeProjectId.value)
  if (!proj) return
  proj.instances = proj.instances.filter(i => i.id !== id)
  if (activeInstanceId.value === id) activeInstanceId.value = null
  saveProjects()
  closeInstanceSheet()
  showToast('environment_deleted')
}

// ══════════════════════════════════════════════════════════
// VAR CRUD
// ══════════════════════════════════════════════════════════

const showVarSheet   = ref(false)
const editVarTarget  = ref<EnvVar | null>(null)
const varSearch      = ref('')
const varTypeFilter  = ref('all')
const revealedVarIds = ref(new Set<string>())

const varForm = reactive({
  key: '', value: '', type: 'string', secret: false, revealInForm: false,
})

const filteredVars = computed(() => {
  if (!activeInstance.value) return []
  return activeInstance.value.vars.filter(v => {
    const matchType   = varTypeFilter.value === 'all' || v.type === varTypeFilter.value
    const q           = varSearch.value.toLowerCase()
    const matchSearch = !q || v.key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)
    return matchType && matchSearch
  })
})

function openAddVar() {
  editVarTarget.value = null
  Object.assign(varForm, { key: '', value: '', type: 'string', secret: false, revealInForm: false })
  showVarSheet.value  = true
}

function editVar(v: EnvVar) {
  editVarTarget.value  = v
  varForm.key          = v.key
  varForm.value        = v.value
  varForm.type         = v.type
  varForm.secret       = v.secret
  varForm.revealInForm = false
  showVarSheet.value   = true
}

function closeVarSheet() {
  showVarSheet.value  = false
  editVarTarget.value = null
}

function saveVar() {
  if (!varForm.key.trim()) return
  const proj = projects.value.find(p => p.id === activeProjectId.value)
  const inst = proj?.instances.find(i => i.id === activeInstanceId.value)
  if (!inst) return

  if (editVarTarget.value) {
    const v = inst.vars.find(v => v.id === editVarTarget.value!.id)
    if (v) {
      v.key    = varForm.key
      v.value  = varForm.value
      v.type   = varForm.type
      v.secret = varForm.secret
    }
    orbLog(`ENV updated: ${varForm.key}`)
  } else {
    inst.vars.push({
      id:     uid(),
      key:    varForm.key,
      value:  varForm.value,
      type:   varForm.type,
      secret: varForm.secret,
    })
    orbLog(`ENV added: ${varForm.key}`)
  }
  saveProjects()
  closeVarSheet()
  showToast(editVarTarget.value ? 'var_updated' : 'var_added')
}

function deleteVar(id: string) {
  const proj = projects.value.find(p => p.id === activeProjectId.value)
  const inst = proj?.instances.find(i => i.id === activeInstanceId.value)
  if (!inst) return
  const v = inst.vars.find(v => v.id === id)
  inst.vars = inst.vars.filter(v => v.id !== id)
  saveProjects()
  closeVarSheet()
  showToast(`deleted: ${v?.key}`)
  orbLog(`ENV deleted: ${v?.key}`)
}

function toggleVarReveal(id: string) {
  if (revealedVarIds.value.has(id)) revealedVarIds.value.delete(id)
  else revealedVarIds.value.add(id)
}

function copyVar(v: EnvVar) {
  navigator.clipboard?.writeText(v.value).then(() => showToast(`copied: ${v.key}`))
  orbLog(`ENV copied: ${v.key}`)
}

// ══════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════

function exportDotEnv() {
  if (!activeInstance.value) return
  const lines = activeInstance.value.vars.map(v => `${v.key}=${v.value}`).join('\n')
  navigator.clipboard?.writeText(lines).then(() => showToast('.env copied to clipboard'))
  orbLog(`ENV exported as .env — ${activeInstance.value.name}`)
}

function exportJson() {
  if (!activeInstance.value) return
  const obj = Object.fromEntries(activeInstance.value.vars.map(v => [v.key, v.value]))
  navigator.clipboard?.writeText(JSON.stringify(obj, null, 2)).then(() => showToast('JSON copied to clipboard'))
  orbLog(`ENV exported as JSON — ${activeInstance.value.name}`)
}

// ══════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════

const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = msg
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}
</script>

<style scoped>
.devkit-root { background:#060810; min-height:100%; }
.scrollbar-hide::-webkit-scrollbar { display:none; }
.scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
.sheet-enter-active,.sheet-leave-active { transition:opacity .28s ease; }
.sheet-enter-active>div,.sheet-leave-active>div { transition:transform .32s cubic-bezier(.32,1.1,.64,1); }
.sheet-enter-from,.sheet-leave-to { opacity:0; }
.sheet-enter-from>div,.sheet-leave-to>div { transform:translateY(100%); }
.toast-enter-active { transition:all .3s cubic-bezier(0.34,1.1,0.64,1); }
.toast-leave-active { transition:all .2s ease; }
.toast-enter-from { opacity:0; transform:translate(-50%,-12px) scale(0.92); }
.toast-leave-to { opacity:0; transform:translate(-50%,-6px) scale(0.96); }
</style>