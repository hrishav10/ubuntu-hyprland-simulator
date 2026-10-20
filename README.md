# Ubuntu Desktop Simulator — a Hyprland-style desktop in your browser

A fully interactive **simulation** of an Ubuntu 24.04 LTS desktop with a
Hyprland-inspired tiling window manager, running entirely in the browser.
Open it and you get a working desktop: a Waybar-style panel, a Wofi-style
launcher, five workspaces, four tiling layouts, a real shell over a
persistent virtual filesystem, a package manager whose installs actually
change what the system can do, and 19 applications.

> **Honesty first.** This is a simulation. It does **not** run a Linux
> kernel or a real Wayland compositor, does not execute commands on your
> computer, does not install real packages, and its Privacy Browser
> **does not connect to the Tor network and provides no anonymity**.
> Full statements: [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) and
> [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## Try it

- **Terminal** (Super+Q): 60+ commands with pipes, redirection, history,
  tab completion, and a sudo flow (password: `ubuntu` — disclosed openly,
  it's a simulation).
  `sudo apt install neofetch` → `neofetch` · `ls | grep txt` ·
  `cat ~/.config/hypr/hyprland.conf` · `cowsay` after installing it.
- **Tiling**: Super+T cycles dwindle → master → floating → fullscreen.
  Super+V floats a window, Super+1–5 switch workspaces,
  Super+Shift+1–5 move windows between them.
- **Files persist** in your browser (IndexedDB) — create files, reboot
  the tab, they're still there.
- **Themes**: Ubuntu Dark/Light, Hyprland Minimal, Midnight, High
  Contrast; accent colours, wallpapers (incl. upload), opacity, gaps
  and rounding — all in Settings.

## Run locally

```bash
npm install
npm run dev      # develop
npm test         # 41 tests (Vitest)
npm run lint     # type check
npm run build    # production build -> dist/
```

## Architecture

React + TypeScript + Vite + Tailwind + Zustand + xterm.js. Modular by
design — `src/desktop` (window manager + tiling engine), `src/panel`,
`src/launcher`, `src/terminal` (parser + command registry),
`src/filesystem` (VFS + permissions + IndexedDB), `src/package-manager`,
`src/apps`, `src/system` (process/resource/network/notification models),
`src/persistence`, `src/testing`.

Why not a real Linux in WebAssembly? We researched it — v86 can't boot
64-bit kernels, WebVM/CheerpX ships Xorg+i3 with Wayland explicitly
unsupported, WebContainers is Node-only. The full comparison and every
other decision:

- [docs/RESEARCH.md](docs/RESEARCH.md) — sources actually consulted
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — A/B/C comparison + design
- [docs/FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md) — what's implemented
- [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) — trust boundaries
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — GitHub + Vercel deploy
- [docs/TECH_STACK.md](docs/TECH_STACK.md) · [docs/TEST_PLAN.md](docs/TEST_PLAN.md)
- [BUILD_LOG.md](BUILD_LOG.md) — how it was built

Reference environment: **Ubuntu 24.04.1 LTS (Noble Numbat)**, kernel
6.8 series, Hyprland 0.41-era configuration conventions (hyprlang).

## License

Project code: MIT. Ubuntu, Hyprland, Tor and other names belong to
their respective projects; this is an unofficial educational simulation
and is not affiliated with Canonical, the Hyprland project, or the Tor
Project.
