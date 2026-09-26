const { contextBridge, ipcRenderer } = require('electron')

// Exposed as window.__local — the local edition's frontend build talks to
// this instead of the real supabase-js client (see
// frontend/src/lib/localSupabase.ts and frontend/src/contexts/LocalAuthContext.tsx).
contextBridge.exposeInMainWorld('__local', {
  query: (descriptor) => ipcRenderer.invoke('db:query', descriptor),
  rpc: (name, args) => ipcRenderer.invoke('db:rpc', name, args),
  listProfiles: () => ipcRenderer.invoke('auth:listProfiles'),
  pickOptician: (id) => ipcRenderer.invoke('auth:pickOptician', id),
  adminLogin: (id, password) => ipcRenderer.invoke('auth:adminLogin', id, password),
  createProfile: (payload) => ipcRenderer.invoke('auth:createProfile', payload),
  signOut: () => ipcRenderer.invoke('auth:signOut'),
  getActiveProfile: () => ipcRenderer.invoke('auth:getActiveProfile'),
})
