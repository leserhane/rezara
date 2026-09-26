const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const { initDb, getDb } = require('./db')
const { runQuery } = require('./db/queryEngine')
const { callRpc, getActiveUser } = require('./db/rpcs')
const auth = require('./db/auth')

// The local edition: all data lives in a SQLite file under the OS user
// data directory (see db/index.js), never touching the internet. This is
// a deliberately different product from the desktop shell that points at
// optimumoptic.com — that cloud-backed, multi-device edition stays
// exactly as it is; this one is for a single till that needs to keep
// working with zero connectivity and zero shared login.

function registerIpcHandlers() {
  const db = getDb()

  ipcMain.handle('db:query', (_event, descriptor) => runQuery(db, descriptor))
  ipcMain.handle('db:rpc', (_event, name, args) => callRpc(db, name, args))

  ipcMain.handle('auth:listProfiles', () => auth.listProfiles(db))
  ipcMain.handle('auth:pickOptician', (_event, id) => {
    try { return { data: auth.pickOptician(db, id), error: null } }
    catch (e) { return { data: null, error: { message: e.message } } }
  })
  ipcMain.handle('auth:adminLogin', (_event, id, password) => {
    try { return { data: auth.adminLogin(db, id, password), error: null } }
    catch (e) { return { data: null, error: { message: e.message } } }
  })
  ipcMain.handle('auth:createProfile', (_event, payload) => {
    try { return { data: auth.createProfile(db, payload), error: null } }
    catch (e) { return { data: null, error: { message: e.message } } }
  })
  ipcMain.handle('auth:signOut', () => { auth.signOut(); return { error: null } })
  ipcMain.handle('auth:getActiveProfile', () => {
    const id = getActiveUser()
    if (!id) return null
    return auth.toProfileShape(db.prepare('SELECT * FROM profiles WHERE id = ?').get(id))
  })
}

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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // the preload script needs Node's ipcRenderer; no remote content is ever loaded so this stays safe
    },
  })

  win.setMenuBarVisibility(false)
  win.loadFile(path.join(__dirname, 'app', 'index.html'))
  return win
}

app.whenReady().then(() => {
  initDb()
  registerIpcHandlers()
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
