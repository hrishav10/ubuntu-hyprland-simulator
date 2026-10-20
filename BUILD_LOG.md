# BUILD_LOG

## 2026-10-20 — v1 build

- **Phase 0 research** (before main code): two research passes over
  authoritative sources — Hyprland wiki (0.41.0 configuring/variables/
  binds/dispatchers/window-rules/dwindle/master + hyprlang), Ubuntu
  24.04 release notes, FHS 3.0 mirrors, Waybar/Wofi/Dunst manpages,
  xterm.js API docs; Tor Browser Manual (security settings, onion
  services), Tor support FAQ + privacy policy, EFF SSD; v86 README,
  WebVM/CheerpX posts, TinyEMU/JSLinux readme, WebContainers docs.
  Notes preserved in `research-notes/`; synthesis in `docs/RESEARCH.md`.
- **Architecture decision**: Approach A (browser-native simulation).
  B rejected with evidence (no WASM engine can present a Wayland
  desktop); C kept as a documented seam only. See `docs/ARCHITECTURE.md`.
- **Scaffold**: Vite React-TS, Tailwind 4, Zustand, @xterm/xterm, Vitest.
- **Filesystem**: FHS seed tree (incl. real-syntax hyprland.conf,
  waybar config.jsonc, kitty.conf, deb822 ubuntu.sources), permissions,
  symlinks, IndexedDB persistence + reset.
- **Window manager**: drag/resize/snap/focus/z, single-instance,
  clamped geometry; 5 workspaces; layouts master (mfact 0.55),
  dwindle (binary partition), floating, fullscreen; gaps/borders.
- **Panel/Launcher/Desktop**: Waybar-style bar with popovers
  (calendar+notifications, wifi, volume/brightness, power/quick
  settings), Wofi-style launcher (search/categories/recents/pinned,
  keyboard nav), VFS desktop icons (draggable), context menus,
  Dunst-style toasts, boot splash, lock screen, power-off screen.
- **Shell**: parser (quotes/$VAR/pipes/redirection), history,
  completion, sudo password flow; **60+ commands** incl. apt/dpkg,
  systemctl, journalctl, hyprctl, man pages; package-gated commands.
- **Package manager**: 22-package registry; install/remove updates
  registry + app availability + VFS markers + dpkg status file.
- **Apps (19)**: Terminal, Files, Text Editor, Code Editor, Browser,
  Privacy Browser, Software, Settings, System Monitor, Network, Media,
  Music, Image Viewer, Document Viewer, Calculator, Calendar, Notes,
  Archive Manager, Help, All-Applications launcher entry.
- **Steering update (owner, mid-build)**: Tor/Privacy Browser —
  removed the planned "SIMULATED" banner/watermark approach; immersion
  first, no UI claims of real Tor/anonymity, disclosure in docs +
  About small print. Also de-plastered "(simulated)" suffixes from
  process names and command output across the system (disclosure
  remains in README/docs/Help/Settings-About).
- **Tests**: 41 Vitest tests across 6 suites — all passing.
  `npm run build` and `npm run lint` (tsc) green.
- **Deploy**: GitHub repo + Vercel production (see docs/DEPLOYMENT.md;
  live URL recorded in the delivery report).
