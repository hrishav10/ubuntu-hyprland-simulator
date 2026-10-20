# Research Notes — Tor Browser & Browser-WASM Linux

Project: Ubuntu + Hyprland browser simulator (simulated desktop, Vercel deploy target)
Date accessed: 2026-10-20 (IST)
Method: `browser.search` + `browser.open` on authoritative sources only
(Tor Project, EFF, Leaning Technologies, StackBlitz/WebContainers, Bellard, v86 README via npm.io).
Facts below are only what an opened page stated. Anything else is labelled **[Inference]**.

> Gaps / failed fetches (not counted as accessed, not used as sources):
> Two `browser.open` attempts timed out upstream — the v86 GitHub mirror and the
> WebVM GitHub mirror. Their licence/compatibility details were therefore taken
> from other opened pages (npm.io v86 README mirror; LeaningTech blog posts),
> not from GitHub. No authoritative Vercel limits page was opened in this pass,
> so no specific Vercel quota/size number is claimed below.

---

## URLs actually accessed (browser.open, successful)

Tor:
- https://tb-manual.torproject.org/mk/security-settings/
- https://Tb-manual.Torproject.org/ps/onion-services/
- https://www.torproject.org/about/privacy_policy/
- https://support.torproject.org/sw/faq/faq-5/
- https://blog.torproject.org/new-user-support-portal-tor-tails/
- https://lists.torproject.org/mailman3/hyperkitty/list/tor-commits@lists.torproject.org/thread/TKGV7YHDBLEMTIKKCT4LMGSDAKGYKOES/
- https://ssd.eff.org/am/module/tor-8615ceac-76c3-46e8-bd87-7bf68e1ca648 — EFF Surveillance Self-Defense (secondary, Tor-linked)

WASM Linux:
- http://labs.leaningtech.com/blog/webvm-20 — WebVM 2.0 (Leaning Technologies)
- https://labs.leaningtech.com/blog/cx-10 — CheerpX 1.0 (Leaning Technologies)
- https://npm.io/package/v86 — v86 README (0.5.472 listing)
- https://bellard.org/tinyemu/readme.txt — TinyEMU / JSLinux, Fabrice Bellard
- https://webcontainers.io/guides/browser-support
- https://webcontainers.io/tutorial/2-setting-up-webcontainers
- https://developer.stackblitz.com/guides/user-guide/what-is-stackblitz
- https://developer.stackblitz.com/platform/webcontainers/troubleshooting-webcontainers

Note on Tor docs location: Tor Project blog (opened above) says
tb-manual.torproject.org will redirect to the new Support portal at
support.torproject.org — "all user-facing documentation in one place".

---

## 1. Tor Browser — verified facts

### What Tor is / how a circuit works
- Tor manual text (quoted in the Tor Project's own tor-commits translation
  archive, opened above): *"Tor is a network of virtual tunnels… Tor works by
  sending your traffic through three random servers (also known as relays) in
  the Tor network. The last relay in the circuit (the 'exit relay') then sends
  the traffic out onto the public Internet."* The illustration's "three keys
  represent the layers of encryption between the user and each relay."
- Same manual text: your ISP / local watcher "will not be able to track your
  internet activity, including the names and addresses of the websites you
  visit"; a site operator "will see a connection coming from the Tor network
  instead of your real Internet (IP) address, and will not know who you are
  unless you explicitly identify yourself."
- EFF SSD (opened): Tor is "a volunteer-run service that provides both privacy
  and anonymity online by masking who you are and where you are connecting
  from"; Tor Browser "sends your communications through Tor"; browsing is via
  randomly selected nodes forming a circuit, viewable via the circuit button.

### No history by default
- Manual text (same archive): "By default, Tor Browser does not keep any
  browsing history. Cookies are only valid for a single session (until Tor
  Browser is exited or a New Identity is requested)."
- Privacy Policy (torproject.org, effective Oct 30, 2025, opened): Tor Browser
  does **not** collect IP addresses, browsing history, device IDs, or location;
  no tracking/telemetry/analytics; no user accounts; "Temporary session cache
  only by default, cleared on exit or 'New Identity'". Bookmarks/downloads the
  user creates *do* persist locally — they are user-created, not collected.

### Fingerprinting resistance
- Manual text: "Tor Browser is designed to prevent websites from
  'fingerprinting' or identifying you based on your browser configuration."
- Privacy Policy §8: built-in defences include uniform user-agent strings,
  screen-size normalisation (Desktop only), and isolation of website content.
  Tor VPN (separate product in the same policy) uses a different Tor circuit
  per app.
- **[Simulator implication, not a Tor claim]** Changing window size, fonts,
  extensions or settings in a look-alike UI does not give this resistance;
  the real resistance comes from all real Tor Browser users sharing the
  same configuration.

### Security levels — exact, from tb-manual security-settings page
Increasing the level "will disable or partially disable certain browser
features to protect against possible attacks… might stop some web pages from
functioning properly". Reversible by adjusting the level + restarting.

| Level | Verified behaviour |
|---|---|
| **Standard** (default) | All Tor Browser and website features are enabled. |
| **Safer** | Disables website features that are often dangerous; some sites lose functionality. JavaScript disabled on all **non-HTTPS** sites. Some fonts and math symbols disabled. Audio/Video (HTML5 media) are click-to-play. |
| **Safest** | Only allows website features required for static sites and basic services; affects images, media, scripts. JavaScript disabled by default on **all** sites. Some fonts, icons, math symbols, and images disabled. Audio/Video are click-to-play. |

EFF corroborates the UX: shield icon → Settings; default uses HTTPS-only
mode and NoScript; Safest "can make some websites unusable".

### Onion services — from tb-manual onion-services page
- Location and IP address are hidden, making it difficult to censor them or
  identify their operators.
- All traffic between Tor users and onion services is end-to-end encrypted,
  "so you do not need to worry about connecting over HTTPS" (for the onion
  transport itself; the page still distinguishes HTTP vs HTTPS onion icons).
- Address is automatically generated; no domain purchase needed. The `.onion`
  URL's cryptography lets Tor ensure it is connecting to the right location
  and the connection is not tampered with.
- An onion address is 56 letters/numbers + `.onion`. Old 16-character v2
  addresses "no longer work on today's Tor network".
- Authenticated onion services exist: client must supply an authentication
  token / private key before access.

### Tor vs VPN — official Tor position
- support.torproject.org FAQ-5 (opened, titled "Tor Browser with VPN"):
  *"Generally speaking, we don't recommend using a VPN with Tor unless you're
  an advanced user who knows how to configure both in a way that doesn't
  compromise your privacy."* It defers detail to the Tor + VPN wiki.
- That is the only Tor-vs-VPN claim verified from a Tor Project page in this
  pass. Do **not** attribute the common comparison-table claims (single
  provider sees both ends, speed difference, etc.) to the Tor Project from
  these sources — those appeared only in non-authoritative search results
  and were not used.
- Distinct thing: "Tor VPN" in the Privacy Policy is a Tor Project app that
  routes app traffic over Tor (per-app circuits) — it is not a commercial VPN.

### Limitations — verified
- Only Tor Browser traffic is anonymised. EFF: "only activities you do inside
  of Tor Browser itself will be anonymized"; other apps on the device are
  not routed through Tor by Tor Browser.
- "Browsing the web is much slower over Tor, and certain websites may not
  work at all." (EFF)
- Logging in / submitting identifying info identifies you to that site:
  the site "will be able to identify you and may know that you're using Tor."
- Anyone who can see your network activity can see you are using Tor (EFF);
  bridges / pluggable transports are the circumvention answer (manual text:
  bridges are volunteer relays "not listed publicly", used with pluggable
  transports to disguise Tor use; using bridges may slow the connection).
- Perfect anonymity is not claimed: EFF — "it's generally impossible to
  achieve perfect anonymity."
- Adding plugins/extensions can de-anonymise you (EFF); do not open
  downloaded documents while online — they may fetch internet resources
  outside Tor and reveal your IP (EFF).
- Exit-node monitoring is possible (EFF notes it is "technically possible
  that Tor exit nodes may be monitored") — hence HTTPS matters on clearnet.
- Security-level trade-off is inherent: higher level = more breakage (manual).

### Simulator rule derived from the above (project decision, not a Tor claim)
A simulated "Tor Browser" window in this project must be clearly labelled
**simulated**: it creates no Tor circuit, reaches no `.onion` service,
provides no anonymity/fingerprinting resistance, and must not be presented
as Tor, a VPN, or a privacy tool. Reproduce only the *look/UX vocabulary*
(circuit display, shield/security levels, onion icon states, New Identity)
as fiction.

---

## 2. Browser-WASM Linux — verified facts

### v86 (x86-to-WASM JIT emulator)
Source: opened npm.io v86 README.
- "v86 emulates an x86-compatible CPU and hardware. Machine code is
  translated to WebAssembly modules at runtime."
- CPU: "around Pentium 4 level, including full SSE3 support." Missing, in
  particular: task gates / far calls, some 16-bit protected-mode features,
  single stepping, some FPU/SSE exceptions, **multicore, 64-bit extensions**.
- Hardware: FPU (Berkeley SoftFloat, "precise (but slow)"), VGA with SVGA +
  Bochs VBE, IDE, NE2000 network, virtio filesystem/network/balloon,
  SoundBlaster 16, PS/2 keyboard/mouse, PIT/PIC, partial APIC, RTC.
- OS compatibility (README's own words): "Linux works pretty well. **64-bit
  kernels are not supported.**" "Ubuntu and other Debian derivatives works
  up to the latest version that supported i386 (16.04 LTS or 18.04 LTS for
  some variants)." Alpine and Arch Linux 32 work; Buildroot minimal images.
- Embedding: `libv86.js`, official npm package (`npm install v86`), ROM/disk
  images loaded via XHR (serve from a web server). Examples list includes
  "Saving and restoring emulator state".
- Licence: "v86 is distributed under the terms of the Simplified BSD License"
  (third-party components under their own licences, listed on the page).

### WebVM / CheerpX (Leaning Technologies)
Sources: opened labs.leaningtech.com WebVM 2.0 and CheerpX 1.0 posts.
- WebVM: "a full Linux environment running in the browser, client-side… a
  complete virtual machine, with support for persistent data storage,
  networking and… Xorg and complete desktop environments… everything
  executes locally within the browser sandbox."
- CheerpX: WASM x86 virtualisation engine — JIT from x86 to WASM **plus a
  Linux syscall emulation layer**; runs unmodified x86 binaries / whole
  distributions. CheerpX 1.0 post is explicit: *"CheerpX does not run the
  Linux kernel itself, but provides an extended set of Linux-compatible
  system calls."* Best-case slowdown "as low as 2x/3x compared to native"
  for binaries using only the most optimised instruction parts.
- Disk: supports large images **up to 2 GB**; data downloaded on demand over
  HTTP byte ranges from "any standard compliant HTTP server" (byte-range
  support is "the only requirement"); WebVM's own backend streams 128 KB
  blocks via a Cloudflare Worker/WebSockets (~20–40 ms per block claimed).
- Persistence: downloaded chunks + user modifications go to an **IndexedDB
  overlay** — "both as a caching-layer and as privacy-preserving persistent
  local storage". Ext2 images, HTTP, IndexedDB, in-memory, and internal
  filesystems (`proc`, `devpts`) can be combined.
- Graphics / Wayland — the decisive passage (WebVM 2.0 post):
  - The shipped desktop is **Xorg**, via an implemented `/dev/dri/card0` +
    KMS API, using "a minimalistic window manager" **i3**, chosen so the
    demo is enjoyable "without consuming excessive amounts of data".
  - "Further improvements in our roadmap will make it practical to run the
    much heavier XFCE environment in future releases."
  - KMS support is "the subset of the API required for **2D rendering**",
    with 3D planned "most likely via WebGPU".
  - *"If you are wondering about Wayland support, it is in our roadmap but
    will take some more time. First of all Wayland depends on EGL, which is
    not yet supported."* It also notes not every app works on Wayland.
- Networking: "Modern browsers do not provide access to low-level TCP/UDP
  sockets" — WebVM therefore integrates **Tailscale** (DERP over WebSockets);
  internet access needs a Tailscale exit node set up by the user. Plain
  fetch/WebSocket substitution for VM traffic is explained as not possible
  / not viable (already-encrypted traffic, same-origin/CORS limits).
- Licensing: WebVM 2.0 post — WebVM is a "liberally licensed FOSS project";
  "CheerpX is completely free-to-use for individuals, for any kind of
  project." CheerpX 1.0 post — "free to use for personal and open source
  projects. Licensing is required for development of commercial software
  and for any business use." (The fuller self-hosting restriction —
  downloading a CheerpX build to host elsewhere — appeared only in a
  search-result snippet of the WebVM repo in this pass and was **not**
  verified on an opened page; check CheerpX's Licensing page before any
  self-host/embed decision.)

### JSLinux / TinyEMU (Fabrice Bellard)
Source: opened bellard.org TinyEMU readme (Bellard's own successor doc).
- §4.5: the x86 emulator "comes from my JS/Linux project (2011) which was
  one of the first emulator running Linux fully implemented in Javascript",
  provided to access the x86 images hosted at bellard.org/jslinux.
- §4.4: "The Javascript version (JSLinux) can be compiled with Makefile.js
  and emscripten. A complete precompiled and preconfigured demo is available
  in the jslinux-YYYY-MM-DD.tar.gz archive."
- TinyEMU itself: RISC-V system emulator (32/64/128-bit) + an x86 system
  emulator *based on KVM* (native, not the browser path), VirtIO console /
  network / block / input / 9P filesystem, graphical display with SDL
  (native build), HTTP block device and remote 9P filesystem.
- Licence: "TinyEMU is released under the MIT license" (SLIRP under
  2-clause BSD).
- No Wayland, Hyprland, Ubuntu-desktop, or persistence claim is made on
  this page. **[Inference]** JSLinux is a demo/education emulator lineage,
  not a maintained full-desktop platform for a product deploy.

### WebContainers (StackBlitz)
Sources: opened webcontainers.io + developer.stackblitz.com pages.
- Definition (StackBlitz): powered by WebContainers, "the first
  WebAssembly-based operating system which boots the Node.js environment
  in milliseconds, securely within your browser tab." It is a **Node.js /
  JavaScript dev environment**, not a general Linux distribution/desktop.
- Only web-native code: "WebContainers can only execute languages that are
  natively supported on the Web, including JavaScript and WebAssembly. It
  is not possible to run native addons… such as C++, unless they can be
  compiled to WebAssembly" — native addons disabled via `--no-addons`.
  Its own Service Worker is "a core component of the networking stack",
  so an app cannot install its own Service Worker inside a WebContainer.
- Hard hosting requirement: a WebContainer document must be served with
  `Cross-Origin-Embedder-Policy: require-corp` and
  `Cross-Origin-Opener-Policy: same-origin` (webcontainers.io tutorial).
- Browser support (webcontainers.io, "Last update: October 2026" on page):
  fully supported on desktop Chromium-based browsers out of the box;
  Safari 16.4 TP and Firefox are **beta** (Firefox page text also says
  "alpha support" for Firefox in its section and notes Firefox "does not
  fully support the required mode for cross-origin isolation", causing
  preview-window limitations). Requires `SharedArrayBuffer` +
  cross-origin isolation.
- No GUI, display server, Wayland, or general-Linux claim anywhere on the
  opened WebContainers pages.

---

## 3. Why a full Wayland GUI desktop via WASM is not viable for this deploy target

Verified premises:
1. The most advanced browser-Linux stack found (WebVM/CheerpX) ships its
   GUI on **Xorg + i3**, not Wayland. Its vendor states Wayland is only on
   the roadmap, "will take some more time", and **EGL — a Wayland
   dependency — "is not yet supported"**. Its KMS implementation covers
   only the 2D subset; 3D is a future WebGPU plan; even XFCE is described
   as a future goal, with i3 chosen to limit data/performance cost.
2. v86 cannot run a modern Ubuntu desktop at all on the verified facts:
   no 64-bit extensions, **no 64-bit kernels**, Ubuntu support stops at
   i386-era releases (16.04 / some 18.04 variants), single-core Pentium-4-
   class CPU.
3. WebContainers is not an OS desktop: it is Node.js-in-a-tab, JS/WASM
   only, no native binaries, and it imposes COOP/COEP cross-origin
   isolation on the hosting page.
4. Browsers expose no raw TCP/UDP sockets (LeaningTech), so even a working
   VM gets networking only via a WebSocket/Tailscale-style workaround —
   not normal desktop networking.
5. CheerpX does not boot a real Linux kernel (syscall emulation instead)
   and caps disk images at 2 GB with on-demand HTTP byte-range streaming;
   persistence is a browser IndexedDB overlay, subject to browser storage
   behaviour — not a real disk.

**[Inference — project conclusion from 1–5, not a quoted claim]**
Hyprland is a Wayland compositor. Since (a) no opened source shows any
browser-WASM engine running Wayland, (b) the one vendor working on GUI
Linux in the browser explicitly lists Wayland/EGL as unsupported, and
(c) the other engines are either 32-bit-only (v86), demo-grade (JSLinux),
or Node-only (WebContainers), a *real* Ubuntu 24.04 + Hyprland desktop
running via WASM on a static Vercel deploy is not viable with these
technologies today. The honest architecture for this project is the
planned one: a **simulated** desktop in React/DOM (window manager, panel,
launcher, terminal illusion, virtual FS in IndexedDB) that *looks and
behaves like* Ubuntu + Hyprland, with any WASM VM, if added at all,
scoped to a terminal/minimal-Xorg experiment — never marketed as real
Hyprland/Wayland, real Tor, or a real OS.

**[Inference — hosting]** A static host *can* in principle serve the
pieces these engines need (COOP/COEP headers for WebContainers;
byte-range serving + large ext2 images for CheerpX), but no Vercel-specific
capability or limit was verified in this pass — confirm Vercel header
config and asset-size behaviour against Vercel's own docs before
committing to any WASM-VM embed on the Vercel deploy.

---

## Bottom line for the simulator

- Tor window = simulated UI only, labelled simulated; copy the vocabulary
  (3-relay circuit, Standard/Safer/Safest, onion services, New Identity)
  exactly as verified above, claim no real anonymity.
- Desktop = simulated Hyprland-style WM in the DOM. Real Wayland via WASM
  is vendor-roadmap, not shipping, per LeaningTech's own post.
- If a real Linux terminal experiment is ever embedded, CheerpX/WebVM
  (Xorg/i3, IndexedDB, Tailscale networking, individual-use licensing) and
  v86 (BSD, 32-bit only) are the only candidates with verified browser
  Linux credentials — neither gives Ubuntu 24.04 + Hyprland.
