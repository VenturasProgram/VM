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
  onAddToPlaylist: (callback) => {
    // Removemos ouvintes antigos para evitar duplicatas ao recarregar componentes
    ipcRenderer.removeAllListeners('add-to-playlist'); // Limpa duplicados
    ipcRenderer.on('add-to-playlist', (_event, data) => callback(data));
},

  onMenuPlay: (callback) => {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on('menu-play-song', subscription);

      // Retorna uma função de limpeza
      return () => {
          ipcRenderer.removeListener('menu-play-song', subscription);
      };
  },
  onUpdateCss: (callback) => ipcRenderer.on('update-user-css', (event, css) => callback(css)),
  openYoutubeMusic: () => ipcRenderer.invoke('Youtube-Music'),

  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, value) => callback(value)),
  onDownloadFinalizado: (callback) => ipcRenderer.on('download-finalizado', (event) => callback()),
  startVideoDownload: (url) => ipcRenderer.invoke('download-video', url)
});