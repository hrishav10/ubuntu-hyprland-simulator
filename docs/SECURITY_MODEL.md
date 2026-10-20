# SECURITY_MODEL.md — Security model and honesty rules

## 1. What this application is

A client-side simulation of an Ubuntu 24.04 + Hyprland-style desktop.
It ships as static files (HTML/CSS/JS) and runs entirely in the user's
browser. There is **no backend, no account system, no telemetry, and no
code path that executes anything on the user's computer** outside the
browser sandbox.

## 2. Trust boundaries

| Boundary | Rule |
|---|---|
| Host OS | The app never executes host commands, never reads the host filesystem, and never installs anything. The "shell" interprets commands against an in-memory virtual filesystem only. |
| Browser storage | The virtual filesystem persists in the origin's IndexedDB; preferences in localStorage. Any site data reset (Settings → About → Reset, or browser site-data clearing) wipes it. No data leaves the device. |
| Network | The simulator generates no network traffic of its own. `ping`, `curl`, `apt update` and friends operate on the session's network/package models — their output describes the *model*, not the wire. |
| Uploads | Wallpaper uploads are read locally (FileReader), downscaled on a canvas, and stored as a data URL in local preferences. Nothing is uploaded anywhere. |
| Dependencies | Runtime deps are React, Zustand, xterm.js, lucide-react (bundled at build time). No remote code is loaded at runtime beyond the static bundle itself. |

## 3. The Privacy Browser (Tor Browser-style app)

### The rule
This app **does not connect to the Tor network, does not build a real
Tor circuit, does not reach real `.onion` services, and provides no
anonymity, no fingerprinting resistance, and no privacy protection of
any kind.** Its pages are rendered from data bundled with the app. Its
"circuit" panel draws relay names from a fixed list to illustrate the
*shape* of a Tor circuit (guard → middle → exit, per the Tor Browser
Manual). Its security levels (Standard / Safer / Safest) reproduce the
Manual's descriptions of what those levels change in the real browser;
here they change only local UI state.

### Presentation decision (product owner, 2026-10-20)
The app deliberately carries **no banner and no "SIMULATED" watermark**:
the owner judged that plastered labels destroy the immersion the
project exists for. Honesty is preserved by three means instead:

1. **No false claims in the UI.** No copy in the app asserts a real Tor
   connection, real anonymity, or real onion routing. Status wording is
   neutral (e.g. "Circuit for this site", relay roles), and unknown
   addresses fail with a plain "Unable to connect" over the local
   directory — there is no fake "Congratulations, you are using Tor"
   success state.
2. **Full disclosure here and in the README / KNOWN_LIMITATIONS.md**
   (this section), where it cannot be missed by anyone evaluating the
   project.
3. **One small-print line** on the app's About page stating it renders
   the experience from local data and does not connect to the Tor
   network, pointing to this document.

The app also does not use Tor Project trademarks as its own branding:
it is named "Privacy Browser" in the launcher, its artwork is a generic
globe/shield treatment in a Tor-Browser-like palette, and the About
page names the upstream project only to describe what the interface is
modelled on.

### Threat-model note for readers
Using this app for anything privacy-sensitive would be a category
error: it is a museum model of a browser, not a browser. For real
private browsing, use the genuine Tor Browser from torproject.org.

## 4. Simulated privileged operations

- `sudo` asks for a password. The password is **`ubuntu`**, disclosed
  openly in `man sudo` and Help — because the privilege boundary is
  itself simulated (it only unlocks writes to root-owned files *inside
  the virtual filesystem*), secrecy would teach the wrong lesson.
- Simulated `apt` mutates only the session package registry, VFS marker
  files under `/var/lib/dpkg/` and `/var/lib/sim-packages/`, and app
  availability. Package descriptions that would over-claim are avoided:
  the UI presents records and state, not host changes.
- `systemctl` mutates only the session service list.
- Processes are rows in a model; `kill` cannot affect anything outside
  the page (it closes the corresponding simulated window, which is the
  honest in-simulation meaning of killing that process).

## 5. What a security reviewer should check

- No `eval`/`Function` outside the Calculator's sandboxed arithmetic
  expression check (regex allow-list of digits/operators before eval).
- Image Viewer renders VFS SVG via `dangerouslySetInnerHTML` — SVGs in
  the VFS are either seeded by the project or authored by the user in
  the Code Editor (same-origin, same-user content; no third-party SVG
  is ever fetched). A deployment that adds multi-user file sharing
  would need to sanitize this sink.
- The Code Editor's highlighter escapes HTML before applying spans.
- No external requests are made by the app bundle at runtime (fonts
  and icons are system/bundled).
