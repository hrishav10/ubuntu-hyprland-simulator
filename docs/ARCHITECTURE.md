# ARCHITECTURE.md — Architecture decision and system design

## 1. The three approaches, compared

### Approach A — Browser-native desktop simulation (CHOSEN)

The desktop, window manager, terminal, filesystem and apps are web
applications (React + TypeScript) that *model* an Ubuntu/Hyprland
system: a virtual filesystem, a shell interpreter, a package database,
a process model. All state lives in the browser (IndexedDB +
localStorage).

- ✅ Deploys as a static site to Vercel; zero servers to run or secure.
- ✅ Fully responsive, themeable, fast startup, works offline after load.
- ✅ Deep, coherent simulation: because the shell, VFS and package
  manager are one system, `apt install cowsay` really does make
  `cowsay` runnable in the terminal and tick the Software app.
- ❌ No real Linux kernel, no real Wayland compositor, no real binaries.
  These limits are disclosed (README, KNOWN_LIMITATIONS.md).

### Approach B — Browser-hosted Linux via WebAssembly / emulation (REJECTED as primary)

Evaluated engines (evidence in RESEARCH.md §6):

| Engine | Blocker for this project |
|---|---|
| v86 | No 64-bit kernels at all; Ubuntu support ends at i386-era 16.04/18.04; Pentium-4-class CPU. Cannot boot Ubuntu 24.04, let alone Hyprland. |
| WebVM / CheerpX | GUI stack is Xorg + i3 by the vendor's own post; **Wayland is roadmap-only, EGL unsupported**; no real kernel (syscall emulation); 2 GB disk cap with HTTP byte-range streaming; networking via Tailscale workaround; commercial use needs a licence. |
| JSLinux / TinyEMU | Demo/education lineage; no Wayland/desktop claims at all. |
| WebContainers | Node.js-in-a-tab, JS/WASM only, no native binaries, no GUI/display server; requires COOP/COEP headers. |

Hyprland **is** a Wayland compositor, so B cannot deliver the brief's
core experience — a Hyprland-style desktop — with any verified engine
today. B is retained only as a possible future experiment (a minimal
terminal VM in a window), never as the desktop itself.

### Approach C — Hybrid: simulation + optional remote execution (OPTIONAL, not built)

A remote container could give real shell execution, but it introduces
authentication, session isolation, cost, abuse surface (unrestricted
server-side shell is explicitly out of scope), and a hard dependency
that would break the "works standalone" requirement. The architecture
below keeps a clean seam for it: the shell's `ShellContext` is an
interface, so a future remote executor could be added behind a flag
without changing apps. Not implemented in v1.

**Decision: Approach A**, standalone, with the C seam documented.

## 2. Module map (mirrors the required `src/` layout)

```
src/
  desktop/     Desktop.tsx (wallpaper, icons, context menu, toasts, keybinds)
               Window.tsx (drag/resize/snap/focus chrome)
               tiling.ts (pure layout engine: master/dwindle/floating/fullscreen)
  panel/       StatusBar.tsx (Waybar-style bar + popovers: calendar,
               notifications, network, audio, quick settings, power)
  launcher/    Launcher.tsx (Wofi-style), ApplicationRegistry.ts
  terminal/    ShellParser.ts (tokenize/pipelines/redirection)
               commands.ts + commands-extra.ts (60+ command registry,
               session, sudo flow, pipeline executor)
  filesystem/  VirtualFilesystem.ts, PathResolver.ts, types.ts
               (permissions), seed.ts (FHS tree), IndexedDBAdapter.ts
  package-manager/ PackageManager.ts (simulated apt/dpkg),
               PackageRegistry.ts
  apps/        One component per application (see FEATURE_MATRIX.md)
  system/      store.ts (Zustand: WM state, settings, notifications,
               clipboard, services), ProcessManager.ts, ResourceModel.ts,
               NetworkModel.ts, EventBus.ts
  persistence/ FilesystemStore.ts (IndexedDB load/save/reset)
  themes/      Theme tokens via CSS variables in src/index.css
               ([data-theme] blocks: ubuntu-dark/light, hyprland-minimal,
               midnight, high-contrast)
  testing/     Vitest suites (see TEST_PLAN.md)
```

## 3. State and data flow

- **Single store** (Zustand) owns: windows, workspaces + per-workspace
  layout, focus/z-order, settings, notifications, clipboard, services,
  and service singletons (`VirtualFilesystem`, `PackageManager`,
  `ProcessManager`, `NetworkModel`).
- **VFS** is a mutable tree of `FSNode`s. Any mutation bumps a version
  counter; the store subscribes and (a) re-renders subscribed UI,
  (b) debounce-saves the serialized tree to IndexedDB.
- **Persistence split**: VFS → IndexedDB (large); settings, package
  installed-set, window session, icon positions → localStorage (small).
- **Processes**: opening a window spawns a simulated process; closing
  (or `kill <pid>`, or System Monitor "End process") removes it.
  Resource graphs derive from the process list, so load follows what
  the user actually opens.
- **Shell** is a pure interpreter over `ShellContext` (fs, pm,
  processes, services, openApp, network state) — unit-testable without
  a DOM; xterm.js is only the rendering/input surface.
- **Tiling** is a pure function (`computeLayout`) over window lists —
  unit-tested for partition/no-overlap/master geometry.

## 4. Window manager semantics

- Window state: id, appId, title, rect, workspace, minimized,
  maximized (+ prevRect), floating flag, z, per-window `data`
  (e.g. open file path). Single-instance apps refocus instead of
  duplicating; geometry is clamped to the viewport.
- Floating layout: pointer drag (title bar), 8-edge resize, edge snap
  (top = maximize, sides = half), double-click title = maximize.
- Tiled layouts ignore stored geometry and compute rects from
  `computeLayout` with the workspace's gaps; a window's floating flag
  (Super+V, or Calculator rule) exempts it — mirroring Hyprland's
  `togglefloating` and window rules.
- Workspaces 1–5 each keep independent windows and layout; switching
  never unmounts another workspace's state (windows are filtered, app
  state lives in the store / component state keyed by window id).

## 5. Security posture (summary)

Everything runs client-side; there is no backend, no account, no
telemetry, and no outbound network use by the simulator itself. The
full model — including the simulated Tor Browser rules — is in
SECURITY_MODEL.md.
