# TEST_PLAN.md — Test plan and results

## Strategy

The engines are pure or interface-driven, so the suite concentrates on
them; UI is covered by type-checking, the production build, and a
manual smoke script (below).

| Suite | File | Covers |
|---|---|---|
| PathResolver | `src/testing/pathresolver.test.ts` | `~` expansion, `.`/`..`, relative resolution, basename/dirname |
| VirtualFilesystem | `src/testing/vfs.test.ts` | FHS seed integrity, CRUD, mkdir -p, copy/move/rename/remove, permission enforcement (+ sudo override), symlink resolution, chmod, serialize/deserialize round-trip |
| ShellParser | `src/testing/shellparser.test.ts` | Tokenizing, quotes, escapes, single-quote marking, pipeline splitting, `>`/`>>` redirection parsing (incl. glued `>file`) |
| Shell commands | `src/testing/shell-commands.test.ts` | End-to-end session: cd/ls, redirection+append, pipelines (`grep`, `sort \| uniq`, `wc -l`), variable assignment/expansion, **sudo prompt flow**, apt install gating (`cowsay`), systemctl state, ps/kill, info commands, find/tree. Also asserts the registry exposes ≥ 40 commands (it exposes 60+). |
| PackageManager | `src/testing/package-manager.test.ts` | Registry, search, install/remove semantics + apt output shape, essential-package protection, VFS marker sync (`/var/lib/dpkg/sim-status`, `/var/lib/sim-packages/*.installed`), update output |
| Tiling | `src/testing/tiling.test.ts` | Master geometry (55% master, stacked slaves), dwindle no-overlap partition, single-window fill, floating exemption, fullscreen focus, maximized, viewport clamping |

## Gates (all must pass before deploy)

```bash
npm test        # Vitest — 41 tests, 6 files
npm run lint    # tsc --noEmit
npm run build   # tsc -b && vite build
```

Current status at delivery: **41/41 tests pass, lint clean, build
clean** (one informational chunk-size warning, ~760 KB / 214 KB gzip).

## Manual smoke script (run after deploy — see DEPLOYMENT.md)

1. Boot completes; a terminal opens on workspace 1.
2. `neofetch` → "can be installed with…"; `sudo apt install neofetch`
   (password `ubuntu`) → `neofetch` renders the logo block.
3. `echo hello > ~/hello.txt`, `cat ~/hello.txt`, reload page → file
   still in Files and readable.
4. Super+R launcher → open Files → create/rename/delete a file.
5. Super+T cycles layouts; open 3 windows in dwindle → no overlaps;
   Super+V floats one; drag its title bar and edges.
6. Super+2 switches workspace; windows from ws1 are gone but return
   intact on Super+1.
7. Panel: clock popover shows calendar + notifications; volume slider;
   Wi-Fi popover connects a network; `ping example.local` in terminal
   now succeeds.
8. Software: install `htop`, run `htop` in terminal; remove it again.
9. Privacy Browser: open Circuit panel (three relays drawn), change
   security level, open `notes.onion`, read the About small print.
10. Settings → switch theme to Ubuntu Light and back; upload a
    wallpaper; lock from the power menu and unlock.

## Future test work

- Playwright e2e for the smoke script against the deployed URL.
- Fuzz the shell parser with random quoting.
- Storage-eviction behaviour (private mode) test in a real browser.
