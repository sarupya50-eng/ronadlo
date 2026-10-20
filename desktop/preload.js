const { contextBridge, ipcRenderer } = require("electron");

// Only the setup window uses this. The music app itself gets no Node access.
contextBridge.exposeInMainWorld("auralis", {
  getKey: () => ipcRenderer.invoke("auralis:get-key"),
  saveKey: (key, force) => ipcRenderer.invoke("auralis:save-key", key, force),
  openLink: (url) => ipcRenderer.invoke("auralis:open-link", url),
});
