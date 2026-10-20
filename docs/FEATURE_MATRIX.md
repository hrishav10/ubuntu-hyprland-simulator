# FEATURE_MATRIX.md — What is implemented, simulated, or absent

Legend: ✅ implemented and functional in the simulation ·
🟡 simulated behaviour (realistic model, in-browser state only) ·
❌ not implemented (see KNOWN_LIMITATIONS.md).

## Desktop core

| Feature | Status | Notes |
|---|---|---|
| Window drag / resize / focus / z-order | ✅ | Floating layout; pointer-based, clamped to viewport |
| Minimize / maximize / restore / close | ✅ | Title bar + Super+M / Super+F / Super+C |
| Edge snapping (top, halves) | ✅ | On drag release |
| Single-instance apps | ✅ | Refocus + merge window data |
| Workspaces 1–5, per-workspace layout | ✅ | State preserved across switches |
| Tiling: master-stack | ✅ | `mfact` 0.55 per Hyprland wiki default |
| Tiling: dwindle | ✅ | Binary-split partition (ratio-based) |
| Tiling: floating / fullscreen | ✅ | |
| Gaps in/out, borders, rounding | ✅ | Settings sliders write the same variables the seeded hyprland.conf names |
| Keybinds with configurable mainMod (SUPER/ALT/CTRL) | ✅ | Listed in Settings → Keyboard and Help |
| Waybar-style panel | ✅ | Workspaces, layout, running apps, CPU/MEM, wifi, volume, battery, clock→calendar+notifications, power menu |
| Wofi-style launcher | ✅ | Search name+description, categories, keyboard nav, recents, pinned |
| Desktop icons tied to VFS | ✅ | From ~/Desktop, draggable, context menu, create/rename via Files |
| Notifications (Dunst-style) | ✅ | Toasts + notification center, do-not-disturb |
| Clipboard | ✅ | Store-level text + file clipboard (Files copy/cut/paste) |
| Lock screen / power off / restart | ✅ | Session state preserved across lock |
| Boot splash | ✅ | systemd-style log lines, skippable |
| Themes (5) + accent + wallpaper (incl. upload) + opacity/font/density | ✅ | CSS-variable theme system, persisted |

## Terminal & shell

| Feature | Status | Notes |
|---|---|---|
| xterm.js rendering | ✅ | FitAddon, custom theme, scrollback |
| Shell parser: quotes, escapes, $VAR, env | ✅ | `ShellParser.ts`, unit-tested |
| Pipelines `\|`, redirection `>`, `>>`, `<` | ✅ | Unit-tested end-to-end |
| History (↑/↓), Ctrl+C/L/U/A/E, tab completion | ✅ | Commands + file paths |
| Command count | ✅ | 60+ entries (`ls cd pwd cat echo touch mkdir rm rmdir cp mv chmod chown ln find grep head tail wc sort uniq ps kill top htop whoami id hostname env export unset history clear neofetch fastfetch uname date cal uptime df du free ip ping apt apt-get dpkg systemctl journalctl man sudo nano vim code which type stat file basename dirname tree lsblk lscpu sensors lsusb hyprctl cowsay cmatrix sl jq git curl wget python3 xdg-open exit sleep ssh scp btop printenv help`) |
| sudo with password prompt | ✅ | Password is `ubuntu`, disclosed in `man sudo` + Help (it is a simulation) |
| Package-gated commands | ✅ | `neofetch` etc. answer "can be installed with: sudo apt install …" until installed |
| Real command execution on the host | ❌ | By design — see SECURITY_MODEL.md |

## Filesystem

| Feature | Status | Notes |
|---|---|---|
| FHS tree with seeded content | ✅ | /, /home/user, /etc, /usr, /var/log, /tmp… |
| Permissions + owner model, sudo override | ✅ | Enforced on read/write/chmod/chown |
| Symlinks (., .., ~ resolution) | ✅ | Loop-safe resolver |
| IndexedDB persistence | ✅ | Debounced save; reset in Settings → About |
| Hard links, ACLs, xattrs | ❌ | `ln` explains and offers `-s` |

## Applications (19 launchable)

| App | Status | Depth |
|---|---|---|
| Terminal (Kitty-style) | ✅ | Full shell session per window |
| Files (Thunar-style) | ✅ | CRUD, rename, delete confirm, properties, hidden files, search, copy/cut/paste, grid/list |
| Text Editor | ✅ | Open/save/save-as against VFS, Ctrl+S |
| Code Editor | ✅ | Syntax highlight overlay, line numbers, save to VFS |
| Web Browser | 🟡 | Tabs/history/bookmarks; bundled local sites only |
| Privacy Browser (Tor Browser-style) | 🟡 | Circuit view, security levels, New Identity, local onion directory — interface only, see SECURITY_MODEL.md |
| Software (package manager) | 🟡 | Search/install/remove over the package registry; apt-style log; install state drives app + command availability |
| Settings | ✅ | Themes, accent, wallpaper+upload, layout vars, keybinds, About + reset |
| System Monitor | ✅ | Process table tied to windows, CPU/MEM graphs, end process |
| Network | 🟡 | Wi-Fi list, connect/disconnect, airplane mode — model only, no traffic |
| Media Player / Music | 🟡 | Synthesized playback + visualizer; VFS audio files are placeholders |
| Image Viewer | ✅ | Renders SVG/data-URL images from VFS, zoom |
| Document Viewer | ✅ | Paginates VFS text documents |
| Calculator | ✅ | Expression evaluation + history |
| Calendar | ✅ | Month view; events persisted as a JSON file in the VFS |
| Notes | ✅ | Notes are real files in ~/Notes |
| Archive Manager | 🟡 | Manifest-based archives; extraction recreates entries as VFS files |
| Help | ✅ | Shortcuts, layouts, honesty notes |
| All Applications | ✅ | Opens the launcher |

## System services

| Service | Status | Notes |
|---|---|---|
| ProcessManager | ✅ | Base system processes + per-window processes |
| ResourceModel | ✅ | CPU/MEM derived from the process list; battery drains over session time |
| NetworkModel | 🟡 | SSID list + connection state consumed by panel, `ip`, `ping`, browsers |
| NotificationService | ✅ | Store-backed, Dunst-style |
| ClipboardService | ✅ | Store-backed |
| systemctl units | 🟡 | start/stop/restart/is-active over the session service list |
| journalctl | 🟡 | Reads seeded/simulated log files from the VFS |
