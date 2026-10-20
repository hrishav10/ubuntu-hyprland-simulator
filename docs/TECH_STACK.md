# TECH_STACK.md — Technology choices

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | The VFS, shell and window manager are stateful models; types keep the 60+ command registry and store honest. `tsc` runs in build + lint. |
| UI framework | React 19 | Component-per-app maps cleanly onto desktop windows; windows mount/unmount by state. |
| Build | Vite 8 | Fast dev server, static output ideal for Vercel. |
| Styling | Tailwind CSS 4 + CSS variables | Utility layout for apps; all themeable values (surface, border, accent, opacity, rounding, font size) are CSS variables switched by `[data-theme]` and Settings, so themes/accent/wallpaper changes need no re-render logic. |
| State | Zustand 5 | One store for WM + system state; service singletons (VFS, PackageManager, ProcessManager) live beside it without prop drilling; selectors keep panel/desktop re-renders cheap. |
| Terminal | @xterm/xterm 6 + @xterm/addon-fit | Industry-standard terminal surface (VS Code's). It is a renderer only — the shell is ours (see RESEARCH.md §4). |
| Icons | lucide-react | Consistent, MIT-licensed icon set for panel/apps. |
| Persistence | IndexedDB (hand-rolled adapter) + localStorage | IndexedDB for the VFS (size, async); localStorage for small prefs/session. No dependency needed for the thin IDB wrapper. |
| Tests | Vitest + jsdom | Unit/integration tests for the pure engines (paths, VFS, parser, shell, packages, tiling) — see TEST_PLAN.md. |
| Lint | `tsc --noEmit` | The template's oxlint remains available; type-checking is the enforced gate in `npm run lint`. |

## Deliberately not used

- **WebContainers / v86 / CheerpX** — evaluated in RESEARCH.md §6;
  none can present a Wayland desktop (ARCHITECTURE.md Approach B).
- **A backend / Supabase / Vercel Functions** — no feature needs one;
  adding one would create attack surface and cost for zero user gain.
- **Framer Motion** — CSS transitions cover the restrained animation
  brief; one less dependency.
- **A component library** — desktop chrome is bespoke by nature; the
  few shared primitives live in `src/apps/shared.tsx`.

## Bundle note

The production bundle is a single ~760 KB JS file (gzip ~214 KB),
dominated by React + xterm.js. Acceptable for a desktop-class web app;
code-splitting per app is a listed future optimisation, not a v1 need.
