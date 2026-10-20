import { dir, file, symlink, type FSNode } from './types'

export const HYPRLAND_CONF = `# ============================================================
# Hyprland configuration — SIMULATED copy inside the virtual FS
# Reference: https://wiki.hypr.land/Configuring/
# ============================================================

# Monitor: name, resolution@refresh, position, scale
monitor=,preferred,auto,1

# Programs
$terminal = kitty
$fileManager = thunar
$menu = wofi --show drun

# Environment variables
env = XCURSOR_SIZE,24
env = QT_QPA_PLATFORMTHEME,qt5ct

# Input
input {
    kb_layout = us
    follow_mouse = 1
    touchpad {
        natural_scroll = true
    }
    sensitivity = 0
}

# General layout / appearance
general {
    gaps_in = 5
    gaps_out = 10
    border_size = 2
    col.active_border = rgba(e95420ee) rgba(77216fee) 45deg
    col.inactive_border = rgba(3f3f46aa)
    layout = dwindle
}

decoration {
    rounding = 10
    blur {
        enabled = true
        size = 6
        passes = 2
    }
    shadow {
        enabled = true
        range = 12
    }
}

animations {
    enabled = true
    bezier = easeOut, 0.16, 1, 0.3, 1
    animation = windows, 1, 4, easeOut, slide
    animation = workspaces, 1, 4, easeOut, slide
}

dwindle {
    pseudotile = true
    preserve_split = true
}

master {
    new_status = master
}

misc {
    force_default_wallpaper = 0
    disable_hyprland_logo = true
}

# Keybindings — $mainMod is SUPER
$mainMod = SUPER

# Autostart (ecosystem utilities)
exec-once = waybar
exec-once = dunst
exec-once = nm-applet --indicator
bind = $mainMod, Q, exec, $terminal
bind = $mainMod, C, killactive,
bind = $mainMod, E, exec, $fileManager
bind = $mainMod, R, exec, $menu
bind = $mainMod, V, togglefloating,
bind = $mainMod, F, fullscreen,
bind = $mainMod, M, exit,
bind = $mainMod, 1, workspace, 1
bind = $mainMod, 2, workspace, 2
bind = $mainMod, 3, workspace, 3
bind = $mainMod, 4, workspace, 4
bind = $mainMod, 5, workspace, 5
bind = $mainMod SHIFT, 1, movetoworkspace, 1
bind = $mainMod SHIFT, 2, movetoworkspace, 2
bind = $mainMod SHIFT, 3, movetoworkspace, 3
bind = $mainMod SHIFT, 4, movetoworkspace, 4
bind = $mainMod SHIFT, 5, movetoworkspace, 5
bind = $mainMod, H, movefocus, l
bind = $mainMod, L, movefocus, r
bind = $mainMod, K, movefocus, u
bind = $mainMod, J, movefocus, d
bindm = $mainMod, mouse:272, movewindow
bindm = $mainMod, mouse:273, resizewindow

# Window rules (v2 syntax)
windowrulev2 = float, class:^(org.gnome.Calculator)$
windowrulev2 = suppressevent maximize, class:.*
`

export const WAYBAR_CONFIG = `{
  // Waybar configuration — simulated copy
  "layer": "top",
  "position": "top",
  "height": 32,
  "modules-left": ["hyprland/workspaces", "hyprland/window"],
  "modules-center": ["clock"],
  "modules-right": ["cpu", "memory", "network", "pulseaudio", "battery", "tray"],
  "clock": { "format": "{:%a %d %b  %H:%M}", "tooltip-format": "{:%Y-%m-%d}" },
  "battery": { "format": "{icon} {capacity}%", "format-icons": ["", "", "", "", ""] }
}
`

export const KITTY_CONF = `# kitty.conf — simulated copy
font_family      JetBrains Mono
font_size        12.0
window_padding_width 8
background_opacity 0.92
confirm_os_window_close 0
enable_audio_bell no
shell_integration enabled
`

const README = `Welcome to your simulated Ubuntu 24.04 LTS desktop (Hyprland-inspired).

This entire environment runs in your browser. Nothing here executes real
Linux commands on your computer, installs real packages, or connects to
the Tor network. It is a faithful simulation built for learning and fun.

Things to try:
  * Open the Terminal (Super+Q) and run: neofetch, ls /etc, cat ~/.config/hypr/hyprland.conf
  * Switch workspaces with Super+1..5 or the panel
  * Toggle tiling layouts in Settings or with Super+T
  * Install a simulated package:  sudo apt install cowsay   then run: cowsay hello
  * Open the "Tor Browser (Simulated)" app and read its honesty banner first

Your files persist in this browser (IndexedDB). Reset them any time from
Settings -> About -> Reset virtual filesystem.
`

const NOTES_TODO = `Shopping / tasks
-----------------
[ ] Finish DSA notes (graphs)
[x] Set up Hyprland rice
[ ] Backup photos from ~/Pictures
[ ] Read man pages for grep and find
`

const HELLO_PY = `#!/usr/bin/env python3
"""A small sample program living in the virtual filesystem."""

def greet(name: str) -> str:
    return f"Hello, {name}! This file lives in a simulated filesystem."

if __name__ == "__main__":
    print(greet("Ubuntu"))
`

const HELLO_CPP = `// hello.cpp — sample C++ source in the virtual filesystem
#include <iostream>

int main() {
    std::cout << "Hello from a simulated Ubuntu desktop!\\n";
    return 0;
}
`

const SYSLOG = `Oct 20 06:12:04 ubuntu-hypr systemd[1]: Started Daily apt download activities.
Oct 20 06:12:05 ubuntu-hypr kernel: [    0.000000] Linux version 6.8.0-45-generic (simulated log line)
Oct 20 06:13:41 ubuntu-hypr NetworkManager[812]: <info>  [sim] wifi: connected to 'HomeNet-5G'
Oct 20 06:15:02 ubuntu-hypr CRON[1044]: (root) CMD (run-parts /etc/cron.hourly)
Oct 20 06:20:18 ubuntu-hypr systemd[1]: apt-daily.service: Deactivated successfully.
`

const HOSTS = `127.0.0.1 localhost
127.0.1.1 ubuntu-hypr
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
`

const OS_RELEASE = `PRETTY_NAME="Ubuntu 24.04.1 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04.1 LTS (Noble Numbat)"
VERSION_CODENAME=noble
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://ubuntu.com/"
UBUNTU_CODENAME=noble
`

const FSTAB = `# /etc/fstab: static file system information (simulated)
UUID=sim-root-uuid /               ext4    errors=remount-ro 0       1
UUID=sim-boot-uuid /boot/efi       vfat    umask=0077          0       1
/swapfile                          none    swap    sw                  0       0
`

const PASSWD = `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:101:103:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
user:x:1000:1000:User,,,:/home/user:/bin/bash
`

const GROUP = `root:x:0:
adm:x:4:user
sudo:x:27:user
users:x:100:
user:x:1000:
docker:x:999:user
`

const JOURNAL = `Oct 20 06:12:01 ubuntu-hypr systemd[1]: systemd 255.4-1ubuntu8 running in system mode. (simulated)
Oct 20 06:12:02 ubuntu-hypr systemd[1]: Reached target Multi-User System.
Oct 20 06:12:03 ubuntu-hypr login[990]: pam_unix(login:session): session opened for user user
Oct 20 06:12:04 ubuntu-hypr systemd[1]: Startup finished in 1.204s (kernel) + 2.881s (userspace) = 4.085s.
`

const DOC_REPORT = `Quarterly notes (plain-text document in the simulated filesystem)
================================================================

The desktop simulator reproduces a coherent subset of Ubuntu:
a virtual filesystem, a shell with 50+ commands, a tiling window
manager inspired by Hyprland, and simulated system services.

Everything is local to your browser. No data leaves the machine.
`

function add(parent: FSNode, node: FSNode) {
  parent.children![node.name] = node
  return node
}

export function buildSeedFilesystem(): FSNode {
  const root = dir('', 'root')
  root.name = ''

  // /home/user
  const homeRoot = add(root, dir('home', 'root'))
  const user = add(homeRoot, dir('user', 'user'))
  const desktop = add(user, dir('Desktop', 'user'))
  add(desktop, file('README.txt', README))
  add(desktop, file('welcome.txt', 'Welcome to the simulated desktop.\nDouble-click files to open them.\n'))
  const docs = add(user, dir('Documents', 'user'))
  add(docs, file('report.txt', DOC_REPORT))
  add(docs, file('ideas.md', '# Ideas\n\n- Learn Hyprland keybinds\n- Try the dwindle layout\n- Write a shell script\n'))
  const downloads = add(user, dir('Downloads', 'user'))
  add(downloads, file('archive.zip', 'SIMULATED ARCHIVE MANIFEST\nhello.py\nnotes/todo.txt\nreadme.txt\n'))
  const pics = add(user, dir('Pictures', 'user'))
  add(pics, file('mountains.svg', svgScene('Simulated Mountains', '#2b1a4a', '#e95420')))
  add(pics, file('city.svg', svgScene('Simulated City Dusk', '#101828', '#77216f')))
  add(pics, file('wallpaper-notes.txt', 'Built-in wallpapers live in Settings. Uploads are stored as files here.\n'))
  const music = add(user, dir('Music', 'user'))
  add(music, file('lofi-study.mp3', 'SIMULATED AUDIO FILE — playback is synthesized in the Media Player app.'))
  add(music, file('ambient-rain.mp3', 'SIMULATED AUDIO FILE — playback is synthesized in the Media Player app.'))
  const notes = add(user, dir('Notes', 'user'))
  add(notes, file('todo.txt', NOTES_TODO))
  const projects = add(user, dir('projects', 'user'))
  add(projects, file('hello.py', HELLO_PY))
  add(projects, file('hello.cpp', HELLO_CPP))
  add(user, file('.bashrc', '# ~/.bashrc (simulated)\nexport PATH=$HOME/bin:$PATH\nalias ll="ls -alF"\nPS1="user@ubuntu-hypr:\\w$ "\n'))
  add(user, file('.profile', '# ~/.profile (simulated)\nif [ -n "$BASH_VERSION" ]; then . ~/.bashrc; fi\n'))
  const config = add(user, dir('.config', 'user'))
  const hypr = add(config, dir('hypr', 'user'))
  add(hypr, file('hyprland.conf', HYPRLAND_CONF))
  const waybar = add(config, dir('waybar', 'user'))
  add(waybar, file('config.jsonc', WAYBAR_CONFIG))
  add(waybar, file('style.css', '/* waybar style (simulated) */\nwindow#waybar { background: rgba(24,24,27,0.85); color: #e4e4e7; }\n'))
  const kitty = add(config, dir('kitty', 'user'))
  add(kitty, file('kitty.conf', KITTY_CONF))
  add(user, dir('.cache', 'user'))
  add(user, dir('.local', 'user'))

  // /etc
  const etc = add(root, dir('etc', 'root'))
  add(etc, file('os-release', OS_RELEASE, 'root'))
  add(etc, file('hostname', 'ubuntu-hypr\n', 'root'))
  add(etc, file('hosts', HOSTS, 'root'))
  add(etc, file('fstab', FSTAB, 'root'))
  add(etc, file('passwd', PASSWD, 'root'))
  add(etc, file('group', GROUP, 'root'))
  add(etc, file('sudoers', '# sudoers (simulated) — root and %sudo may run commands\nroot ALL=(ALL:ALL) ALL\n%sudo ALL=(ALL:ALL) ALL\n', 'root', 0o440))
  const aptDir = add(etc, dir('apt', 'root'))
  add(aptDir, file('sources.list', '# Ubuntu 24.04: sources moved to the deb822 file /etc/apt/sources.list.d/ubuntu.sources\n# See that file for the simulated repository configuration.\n', 'root'))
  const aptSources = add(aptDir, dir('sources.list.d', 'root'))
  add(aptSources, file('ubuntu.sources', 'Types: deb\nURIs: http://archive.ubuntu.com/ubuntu\nSuites: noble noble-updates noble-backports\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n\nTypes: deb\nURIs: http://security.ubuntu.com/ubuntu\nSuites: noble-security\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n', 'root'))

  // /usr
  const usr = add(root, dir('usr', 'root'))
  const share = add(usr, dir('share', 'root'))
  const appsDir = add(share, dir('applications', 'root'))
  add(appsDir, file('org.kitty.desktop', '[Desktop Entry]\nName=Kitty Terminal (simulated entry)\nExec=kitty\nType=Application\n', 'root'))
  const bin = add(usr, dir('bin', 'root'))
  add(bin, file('README', 'Simulated binaries. The shell implements commands in TypeScript; these files are markers.\n', 'root'))
  add(root, dir('bin', 'root'))
  add(root, dir('boot', 'root'))
  add(root, dir('dev', 'root'))
  add(root, dir('mnt', 'root'))
  add(root, dir('opt', 'root'))
  add(root, dir('proc', 'root'))
  add(root, dir('root', 'root', 0o700))
  add(root, dir('run', 'root'))
  add(root, dir('srv', 'root'))
  add(root, dir('sys', 'root'))
  const tmp = add(root, dir('tmp', 'root', 0o777))
  add(tmp, file('.keep', ''))
  const varDir = add(root, dir('var', 'root'))
  const log = add(varDir, dir('log', 'root'))
  add(log, file('syslog', SYSLOG, 'root'))
  add(log, file('system.journal', JOURNAL, 'root', 0o640))
  add(log, file('auth.log', 'Oct 20 06:12:03 ubuntu-hypr login[990]: pam_unix(login:session): session opened for user user(uid=1000)\n', 'root', 0o640))
  const lib = add(varDir, dir('lib', 'root'))
  const dpkg = add(lib, dir('dpkg', 'root'))
  add(dpkg, file('sim-status', '# simulated dpkg status — updated by the simulated package manager\n', 'root'))

  // symlink /home/user/link-to-docs -> Documents (relative-ish example, absolute target)
  add(user, symlink('docs-link', '/home/user/Documents'))
  return root
}

function svgScene(title: string, bg: string, accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="${bg}"/><circle cx="640" cy="110" r="55" fill="${accent}"/><polygon points="0,500 240,210 420,500" fill="#18181b" opacity="0.85"/><polygon points="220,500 470,150 720,500" fill="#27272a"/><text x="36" y="462" font-family="monospace" font-size="26" fill="#fafafa">${title}</text></svg>`
}

export const MANUAL_PAGES: Record<string, string> = {
  ls: 'ls(1) — list directory contents\n\nSYNOPSIS: ls [-la] [path]\nLists files. -l long format, -a include hidden, -h human sizes (with -l).',
  cd: 'cd(1) — change the working directory. Supports ~, ., .. and absolute paths.',
  cat: 'cat(1) — concatenate and print files. Usage: cat file...',
  grep: 'grep(1) — print lines matching a pattern. Usage: grep [-i] [-n] pattern [file]. Without a file, reads stdin (pipe).',
  find: 'find(1) — search for files in a directory hierarchy. Usage: find [path] [-name pattern]',
  chmod: 'chmod(1) — change file mode bits. Usage: chmod 644 file OR chmod +x file.',
  apt: 'apt(8) — SIMULATED package manager front-end. Commands: update, install, remove, search, list --installed. Nothing is really installed.',
  sudo: 'sudo(8) — execute a command as root (simulated). In this simulator the password is "ubuntu" (shown openly: it is a simulation).',
  hyprctl: 'hyprctl(1) — SIMULATED Hyprland control utility. Subcommands: monitors, workspaces, clients, version.',
  neofetch: 'neofetch(1) — SIMULATED system info display (fastfetch also works). Install the neofetch package first.',
  systemctl: 'systemctl(1) — SIMULATED service control. Subcommands: status, list-units, start/stop/restart <unit> (state is simulated).',
  journalctl: 'journalctl(1) — SIMULATED journal viewer. Flags: -n N, --no-pager.',
  ping: 'ping(8) — SIMULATED ICMP echo. No real network traffic is generated.',
  ps: 'ps(1) — report a snapshot of simulated processes. Flags: aux, -ef.',
  kill: 'kill(1) — send a signal to a simulated process. Usage: kill [-9] pid.',
  echo: 'echo(1) — display a line of text. Supports $VARIABLE expansion and redirection via the shell.',
  nano: 'nano(1) — in this simulator, opens the Text Editor app on the file.',
}
