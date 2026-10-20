# DEPLOYMENT.md — Build, run, deploy

## Local development

```bash
npm install
npm run dev        # Vite dev server
npm test           # Vitest (41 tests)
npm run lint       # tsc --noEmit type check
npm run build      # tsc -b && vite build -> dist/
npm run preview    # serve the production build locally
```

Requirements: Node 20+ (developed on Node 24). No environment variables
and no backend are needed — the app is fully static.

## GitHub

Repository: `hrishav10/ubuntu-hyprland-simulator` (public), default
branch `main`, conventional-commit history:

```
feat: ...   fix: ...   docs: ...   test: ...   chore: ...
```

## Vercel

The project deploys as a static Vite site:

1. Link once: `npx vercel link --project ubuntu-hyprland-simulator`
   (or import the GitHub repo in the Vercel dashboard).
2. Framework preset: **Vite**. Build command `npm run build`, output
   directory `dist`. No environment variables.
3. Production deploy: `npx vercel --prod` (or push to `main` with the
   Git integration enabled).

No SPA rewrite rules are required (the app is a single page that does
not use URL routing), and no COOP/COEP headers are needed because the
chosen architecture (ARCHITECTURE.md, Approach A) uses neither
WebContainers nor SharedArrayBuffer.

Deployed production URL: https://ubuntu-hyprland-simulator.vercel.app
(Deployment Protection/SSO is disabled for this project so the demo is publicly accessible.)

## Verification after deploy

```bash
curl -sI https://ubuntu-hyprland-simulator.vercel.app/ | head -5        # expect HTTP 200
curl -s https://ubuntu-hyprland-simulator.vercel.app/ | grep -o '<title>[^<]*</title>'
# expect: <title>Ubuntu Desktop — Hyprland-style Simulator</title>
```

Then smoke-test in a browser: boot → terminal opens → run
`sudo apt install cowsay` (password `ubuntu`) → `cowsay it works` →
switch workspace with Super+2 → open Files → create a file → reload
the page → the file must still exist (IndexedDB persistence).

## Rollback

Vercel keeps prior deployments; promote any previous production
deployment from the dashboard or `npx vercel promote <url>`. The app
stores user state only in the visitor's browser, so rollbacks have no
server-side data implications.
