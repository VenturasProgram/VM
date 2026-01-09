const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Esta função envia a URL para o processo principal e espera uma resposta
  baixarMusica: (url) => ipcRenderer.invoke('download-music', url),
  
  onProgress: (callback) => ipcRenderer.on('download-progress', (event, value) => callback(value)),

  // Ler biblioteca
  getLibrary: () => ipcRenderer.invoke('get-library'),
  
  // Ouvir eventos do Main (A parte que falta!)
  onLibraryUpdated: (callback) => ipcRenderer.on('library-updated', () => callback()),
  
  // Limpar o escutador para evitar vazamento de memória
  removeLibraryListener: () => ipcRenderer.removeAllListeners('library-updated'),

  AtualizarDiscord: (dados) => ipcRenderer.send('canal-discord', dados),

  showContextMenu: (data) => ipcRenderer.send('show-context-menu', data),

  onMenuPlay:(callback) => ipcRenderer.on('menu-play-song', (event, index) => callback(index)),
  onUpdateCss: (callback) => ipcRenderer.on('update-user-css', (event, css) => callback(css)),
});