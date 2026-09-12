const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')

// The desktop app is a thin native shell around the live site rather than
// a bundled copy of the frontend: this app ships fixes and features to
// production near-daily, and Supabase access always needs the internet
// anyway, so there is nothing to gain from a frozen local copy — only the
// downside of every user needing a new installer for every change. This
// way the .exe never goes stale; only the shell itself (this file) would
// ever need a new build, and that changes rarely.
const APP_URL = process.env.OPTIMUM_APP_URL || 'https://optimumoptic.com/dashboard/'

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#fdfbf7',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.setMenuBarVisibility(false)
  win.loadURL(APP_URL)

  // Links to another origin (e.g. a "mailto:" or an external reference)
  // open in the user's regular browser instead of hijacking the app
  // window — the app itself only ever needs to show optimumoptic.com.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL) && !url.includes('optimumoptic.com')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // A plain "site can't be reached" is a dead end for a store employee —
  // give them a one-click way to try again once their connection is back,
  // matching the same "explain what's wrong, offer a way out" approach
  // used throughout the app itself (e.g. the crash screen's reload button).
  win.webContents.on('did-fail-load', (_event, errorCode, _errorDescription, validatedURL) => {
    if (errorCode === -3) return // ERR_ABORTED: a normal navigation cancel, not a real failure
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(`
        <!doctype html>
        <html lang="fr">
        <head><meta charset="utf-8" />
          <style>
            body { font-family: system-ui, sans-serif; background: #d9c8ae; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; border-radius: 12px; padding: 32px; max-width: 380px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
            h1 { color: #6b1f2a; font-size: 18px; margin: 0 0 12px; }
            p { color: #555; font-size: 14px; }
            button { margin-top: 16px; background: #6b1f2a; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }
            button:hover { background: #551821; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Connexion impossible</h1>
            <p>Optimum Optic a besoin d'une connexion internet pour fonctionner. Vérifiez votre connexion puis réessayez.</p>
            <button onclick="location.href='${APP_URL}'">Réessayer</button>
          </div>
        </body>
        </html>
      `)
    )
  })

  return win
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
