# RESEARCH.md — Research findings

Research performed 2026-10-20 before and during implementation. Only sources
actually accessed with browser tools are cited; full access logs live in
`research-notes/hyprland-ubuntu.md` and `research-notes/tor-and-wasm.md`.
Facts are marked **verified** (read on the page) or **snippet** (search
result text only). Inferences are labelled as such.

## 1. Reference environment

- **Ubuntu 24.04 LTS "Noble Numbat"** is the reference release.
  - Release notes (verified): https://documentation.ubuntu.com/release-notes/24.04/
    — Linux kernel 6.8, systemd 255.4, glibc 2.39, Python 3.12 default,
    GCC 14, support until 31 May 2029 (5y, extendable with Ubuntu Pro).
  - LWN (verified via search): Ubuntu 24.04 LTS released April 25, 2024,
    ships GNOME 46 and a new App Center — https://lwn.net/Articles/971143/
  - 24.04 APT change (verified on release notes): sources moved from
    `/etc/apt/sources.list` to the deb822 file
    `/etc/apt/sources.list.d/ubuntu.sources`. The seeded VFS mirrors this.
- The simulator's host identity: hostname `ubuntu-hypr`, user `user`
  (uid 1000, groups: user, adm, sudo — matching the seeded `/etc/passwd`
  and `/etc/group` conventions).

## 2. Filesystem Hierarchy Standard

- FHS 3.0 (Linux Foundation, 2015) — the official page
  https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index timed out on open;
  facts below are from the FHS text mirrors/summaries that were accessed:
  - http://docs.oregonstate.education/cs-374-online/modules/01/filesystem/fhs/
  - https://www.textbookoflinux.com/chapter/filesystem-hierarchy.html
  - https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard
  - Ubuntu `hier(7)` manpage (snippet): https://manpages.ubuntu.com/manpages/focal/man7/hier.7.html
- Verified directory purposes used by the VFS: `/bin` essential binaries,
  `/boot` bootloader files, `/dev` device files, `/etc` host-specific static
  configuration (no binaries), `/home` user homes, `/lib` essential shared
  libraries, `/media` removable-media mounts, `/mnt` temporary mounts,
  `/opt` add-on packages, `/proc` procfs, `/root` root's home (mode 700),
  `/run` runtime data, `/sbin` system binaries, `/srv` service data,
  `/sys` sysfs, `/tmp` temporary files, `/usr` secondary hierarchy
  (`/usr/bin`, `/usr/share/applications`, …), `/var` variable data
  (`/var/log`, `/var/lib/dpkg`, …).
- Ubuntu/Debian use the merged-usr layout (`/bin` → `/usr/bin` symlinks);
  the simulator keeps both directories for teaching clarity.
- XDG user dirs (Desktop, Documents, Downloads, Music, Pictures, Videos,
  Notes as a session convention) come from `user-dirs.defaults` conventions
  (snippet-level) and are seeded under `/home/user`.
- Permissions model: owner/group/other × rwx; 644 default file, 755
  directory/executable, umask 022; `/etc/shadow`-class files are restricted.
  The VFS implements this model (see `src/filesystem/types.ts#canAccess`).

## 3. Hyprland and Wayland

Opened on the official wiki (wiki.hypr.land):

- https://wiki.hypr.land/ — "A Wayland compositor is a fully autonomous
  Display Server, like Xorg itself"; compositors cannot be mixed and
  matched. The wiki is versioned; check your version with `hyprctl version`.
- https://wiki.hypr.land/Hypr-Ecosystem/hyprlang/ — config language:
  `COMMAND = VALUE`, `$VAR = value`, categories `name { ... }`, `#` comments.
- https://wiki.hypr.land/0.41.0/Configuring/Configuring-Hyprland — config
  lives at `~/.config/hypr/hyprland.conf`, auto-reloads on save.
- https://wiki.hypr.land/0.41.0/Configuring/Variables/ — real variable
  names and defaults: `general:gaps_in` 5, `gaps_out` 20, `border_size` 1,
  `col.active_border`, `layout` default `dwindle`; `decoration:rounding`,
  `active_opacity`, blur subcategory; `input:kb_layout`, `follow_mouse`.
- https://wiki.hypr.land/0.41.0/Configuring/Binds/ — bind syntax
  `bind=MODS,key,dispatcher,params`, flags (l/r/e/n/m/t/i), `bindm` mouse
  binds (272 = LMB, 273 = RMB), `unbind`, submaps.
- https://wiki.hypr.land/0.41.0/Configuring/Dispatchers/ — dispatchers:
  `exec`, `killactive`, `workspace`, `movetoworkspace`,
  `togglefloating`, `fullscreen` (0/1/2), `movefocus`, `layoutmsg`, … and
  the workspace selector grammar (`+1`, `name:Web`, `special`, …).
- https://wiki.hypr.land/0.41.0/Configuring/Keywords — `exec-once`,
  `monitor=,preferred,auto,1`, `env = XCURSOR_SIZE,24`, `source=`.
- https://wiki.hypr.land/0.41.0/Configuring/Window-Rules — `windowrule`
  (v1) and `windowrulev2 = float,class:^(kitty)$`; rules are case
  sensitive; canonical example `windowrulev2 = suppressevent maximize, class:.*`.
- https://wiki.hypr.land/Configuring/Dwindle-Layout/ — dwindle is a
  BSPWM-like binary tree; splits derive from the parent node's W/H ratio
  unless `preserve_split`; variables `pseudotile`, `force_split`,
  `default_split_ratio` (default 1.0).
- https://wiki.hypr.land/Configuring/Layouts/Master-Layout/ — master
  layout: master takes the left by default, `mfact` default 0.55,
  `new_status` (master/slave/inherit), `orientation`.
- Version caveat (verified on the wiki): the current master docs note
  hyprlang is deprecated in favour of Lua config since Hyprland 0.55.
  This project deliberately models the classic 0.41-era hyprlang surface
  (`hyprland.conf`), which is the syntax the seeded config uses; the Lua
  migration is listed in KNOWN_LIMITATIONS.md.

Ecosystem utilities (verified via Ubuntu manpages):

- Waybar config is JSON at `~/.config/waybar/config`, styling in CSS;
  options `layer`, `position`, `modules-left/center/right`, `exclusive`;
  Hyprland setups use `hyprland/workspaces`, `hyprland/window` modules —
  https://manpages.ubuntu.com/manpages/noble/man5/waybar.5.html
- Wofi is "a rofi inspired launcher for wlroots compositors"; modes
  `run`/`drun`/`dmenu`; `$menu = wofi --show drun` is the standard binding —
  https://manpages.ubuntu.com/manpages/noble/man5/wofi.5.html and
  https://manpages.ubuntu.com/manpages/noble/en/man7/wofi.7.html
- Dunst is a lightweight notification daemon, INI-style `dunstrc`,
  usually autostarted via `exec-once = dunst` (snippet-level:
  https://manpages.ubuntu.com/manpages/focal/en/man1/dunst.1.html).

The seeded `~/.config/hypr/hyprland.conf`, `~/.config/waybar/config.jsonc`
and `~/.config/kitty/kitty.conf` use exactly these conventions.

## 4. xterm.js

- https://xtermjs.org/ and the official API docs:
  https://xtermjs.org/docs/api/terminal/classes/terminal/ and
  https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/
- Verified: xterm.js is a **front-end component only** — it renders a
  terminal and emits input (`onData`), but "is not bash"; an application
  must supply the interpreter. Features: curses/mouse support,
  GPU-accelerated renderers, Unicode/CJK/IME, theming, addons
  (`@xterm/addon-fit` used here). Options used: `convertEol`,
  `scrollback`, `theme`, `fontFamily`, `cursorBlink`.
- Consequence for this project: we implement the shell ourselves
  (`src/terminal/`) and feed xterm.js via `write`/`onData`.

## 5. Tor Browser

Opened on Tor Project sources (details in `research-notes/tor-and-wasm.md`):

- https://tb-manual.torproject.org/mk/security-settings/ — security
  levels: **Standard** (all features enabled), **Safer** (JavaScript off
  on non-HTTPS sites, some fonts/math symbols off, HTML5 media
  click-to-play), **Safest** (JavaScript off everywhere by default,
  only features needed for static sites). Level changes are reversible.
- https://tb-manual.torproject.org/ps/onion-services/ (onion-services
  page) — onion services hide location/IP, traffic is end-to-end
  encrypted, addresses are auto-generated 56-char `.onion` names.
- Tor manual text (via the Tor Project's own translation archive):
  traffic goes through **three relays** (guard, middle, exit); the exit
  relay sends traffic to the public internet; the ISP can see Tor use
  but not destinations; sites see the exit relay's IP.
- Tor Browser keeps no browsing history by default; cookies last one
  session (manual; also Tor Project Privacy Policy,
  https://www.torproject.org/about/privacy_policy/).
- Fingerprinting resistance comes from all users sharing one
  configuration (uniform UA, window-size normalisation) — Privacy
  Policy §8.
- Tor vs VPN (official position, https://support.torproject.org/sw/faq/faq-5/):
  "we don't recommend using a VPN with Tor unless you're an advanced
  user…" — no stronger comparison is attributed to the Tor Project.
- Limitations (EFF Surveillance Self-Defense, linked from Tor docs):
  only Tor Browser traffic is routed; browsing is slower; logging in
  identifies you to that site; perfect anonymity is impossible.

How this shaped the build is documented in SECURITY_MODEL.md. The
research-derived "labelling rule" was later overridden by the product
owner's presentation decision (see SECURITY_MODEL.md §3): no banner or
watermark in the app, no UI copy claiming real connection/anonymity,
disclosure in docs + one small-print line in the app's About page.

## 6. Browser-WASM Linux (approaches for ARCHITECTURE.md)

- **v86** (npm.io README, opened): x86-to-WASM JIT, ~Pentium 4 class,
  **no 64-bit extensions, no 64-bit kernels**; Ubuntu support stops at
  i386-era releases (16.04 / some 18.04); BSD licence.
- **WebVM / CheerpX** (Leaning Technologies blog, opened:
  http://labs.leaningtech.com/blog/webvm-20 and
  https://labs.leaningtech.com/blog/cx-10): syscall emulation (no real
  kernel), disk images ≤ 2 GB streamed over HTTP byte ranges, IndexedDB
  overlay persistence, GUI is **Xorg + i3**; Wayland is roadmap-only and
  EGL "is not yet supported"; networking needs a Tailscale-style
  workaround because browsers expose no raw TCP/UDP; CheerpX free for
  personal/open-source use, commercial use needs a licence.
- **JSLinux / TinyEMU** (https://bellard.org/tinyemu/readme.txt):
  Bellard's JS Linux lineage (2011), demo/education oriented, MIT.
- **WebContainers** (https://webcontainers.io/guides/browser-support and
  tutorial): a Node.js environment in a tab — JS/WASM only, no native
  binaries, requires COOP/COEP cross-origin isolation headers,
  Chromium-first support. Not a general Linux desktop.

Conclusion (inference from the verified premises above, argued fully in
ARCHITECTURE.md): no browser-WASM engine can run a real Ubuntu 24.04 +
Hyprland (Wayland) desktop on a static Vercel deploy today; the viable
architecture is a browser-native simulation (Approach A).
