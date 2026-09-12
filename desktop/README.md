# Optimum Optic — application de bureau (Windows)

A thin Electron shell around the live site (`main.js`) — it opens
`https://optimumoptic.com/dashboard/` in its own window with no browser
chrome, a desktop/Start Menu shortcut, and its own icon. It does **not**
bundle a copy of the frontend: every fix or feature shipped to the site
reaches installed desktop copies instantly, with no new installer needed.
Only changes to this shell itself (this folder) ever need a new build.

## Getting the installer

The `.exe` is built automatically by
[`.github/workflows/build-windows.yml`](../.github/workflows/build-windows.yml)
on GitHub's `windows-latest` runner (an NSIS Windows installer isn't
reliably buildable from Linux without Wine, so this runs on real Windows
instead). It fires on every push to `main` that touches `desktop/**`, or
manually from the **Actions** tab → *Build Windows installer* → **Run
workflow**. Once it finishes, download `OptimumOptic-Windows-Installer`
from the run's **Artifacts** section — that's the installer to hand to
users.

## Local development

```
cd desktop
npm install
npm start              # runs the shell locally
npm run dist:win       # builds the installer (Windows host, or CI)
```

Set `OPTIMUM_APP_URL` to point the shell at a different URL for testing
(e.g. a local dev server) instead of the production site.
