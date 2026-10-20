# KNOWN_LIMITATIONS.md — Known limitations

Read this before assuming the simulation is the real thing. The short
version: **this is a browser simulation of an Ubuntu/Hyprland desktop —
not Linux, not Wayland, not Tor, and not a package manager for your
computer.**

## Platform limits

- **No real kernel or Wayland compositor.** The "compositor" is DOM/CSS.
  There are no Wayland protocols, no real surfaces, no GPU rendering
  pipeline. Window behaviour (tiling, focus, workspaces) is modelled on
  Hyprland's documented behaviour, not produced by Hyprland.
- **Config drift:** Hyprland's current (post-0.55) documentation moves
  configuration to Lua; this project models the classic hyprlang
  `hyprland.conf` surface (0.41-era wiki), which the seeded config uses.
- **No real shell execution.** Commands are TypeScript interpreters over
  the virtual filesystem. Shell features beyond the documented set
  (job control, globbing, `&&`/`;` sequencing, subshells, scripting)
  are absent or partial: `;` and `&&` are not parsed, globs are not
  expanded (quote-free `*` works only inside `find -name` patterns).
- **No real networking.** Wi-Fi, `ip`, `ping`, browsers and onion
  addresses all read from local models/data. The bundled "web" is a
  small set of local pages; arbitrary URLs fail like unreachable hosts.
- **Privacy Browser is an interface model.** It does not connect to the
  Tor network and provides **no anonymity** — full statement in
  SECURITY_MODEL.md §3.
- **Packages are records.** Installing changes session state (command
  and app availability, VFS marker files), never the host.
- **Persistence is per-browser.** IndexedDB/localStorage can be evicted
  by the browser (storage pressure, private mode, site-data clearing).
  There is no account sync or export/import in v1.
- **Media files are placeholders.** The `.mp3` entries in ~/Music are
  text markers; the Media Player synthesizes progress/visuals locally
  and says so in its UI.
- **PDF support is text pagination.** The Document Viewer paginates
  text documents from the VFS; it does not parse binary PDF.
- **Archives are manifests.** `.zip` files store an entry list;
  extraction recreates those entries as files. No real zip codec.
- **Single user, single machine.** No login accounts, no multi-seat,
  no SSH server, no systemd — services are rows in a session model.
- **Keyboard:** with mainMod = SUPER, some browsers/OSes reserve
  combinations; ALT and CTRL are offered as alternatives in Settings.
  The shell does not support interactive full-screen programs
  (vim/htop render as snapshots or open the GUI editor/monitor).
- **Mobile:** the desktop is usable on small screens (windows clamp,
  panel condenses) but the experience is designed for desktop
  viewports; touch drag works via pointer events, multi-touch
  gestures (three-finger workspace swipe) are not implemented.
- **Performance:** very large VFS trees (thousands of files) will slow
  the debounced whole-tree IndexedDB save; v1 targets a curated tree.
