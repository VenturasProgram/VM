import { app, BrowserWindow, protocol, Menu, shell } from 'electron';
import path from 'node:path';
const started = require('electron-squirrel-startup');
import fs from 'fs';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('vm', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('vm');
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
const isPackaged = app.isPackaged;

const binPath = isPackaged ? path.join(process.resourcesPath, 'bin' ) : path.join(app.getAppPath(), 'bin');

const musicPath = isPackaged ? path.join(process.resourcesPath, 'music' ) : path.join(app.getAppPath(), 'music');

const coverPath = isPackaged ? path.join(process.resourcesPath, 'cache_cover' ) : path.join(app.getAppPath(), 'cache_cover');
const histPath = isPackaged ? path.join(process.resourcesPath) : path.join(__dirname);
const watchUserCss = (mainWindow) => {
  fs.watch(externalCssPath, (eventType) => {
    if (eventType === 'change') {
      try {
        const updatedStyle = fs.readFileSync(externalCssPath, 'utf-8');
        mainWindow.webContents.send('update-user-css', updatedStyle);
      } catch (error) {
        console.error('Erro ao ler o arquivo CSS atualizado:', error);
      }
    }
  })
}
 let ytMusicWindow = null;
const YoutubeMusicWindow = () => {
  if (ytMusicWindow) {
    ytMusicWindow.focus();
    return;
  }
   ytMusicWindow = new BrowserWindow({
    width: 1200, 
    height: 800, 
    titleBarStyle: 'default', 
    autoHideMenuBar:true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:ytmusic', // Isola os cookies/cache do YouTube Music do restante do app

      preload: path.join(__dirname, 'Copy.js') // Preload para comunicação segura
    }
  });
  ytMusicWindow.loadURL('https://music.youtube.com/', {userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});

  // Limpa a referência quando a janela for fechada manualmente
  ytMusicWindow.on('closed', () => {
    ytMusicWindow = null;
  });
}
let mainWindow = null;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden'
  });
  mainWindow.maximize();
  mainWindow.show();

  mainWindow.webContents.on('did-finish-load', () => {
    const userStyle = fs.readFileSync(externalCssPath, 'utf-8');
    mainWindow.webContents.insertCSS(userStyle);
  });
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
  watchUserCss(mainWindow);
  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};
protocol.registerSchemesAsPrivileged([
  {scheme: 'media', privileges: {secure:true, standard:true, supportFetchAPI: true}}
]);
let downloadWindow = null;

const createDownloadWindow = () => {
  if (downloadWindow) {
    downloadWindow.focus();
    return;
  }

  downloadWindow = new BrowserWindow({
    width: 350,
    height: 180,
    resizable: false,
    frame: true, 
    autoHideMenuBar: true,
    webPreferences: {
      // Importante: use o mesmo preload para as funções de progresso funcionarem
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  // Carrega o arquivo HTML puro
  // Se o arquivo estiver na mesma pasta do main.js:
  downloadWindow.loadFile(path.join(__dirname, 'download-status.html'));

  downloadWindow.on('closed', () => {
    downloadWindow = null;
  });
};

const externalCssPath = path.join(process.resourcesPath, 'user-style.css');
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (!fs.existsSync(externalCssPath)) {
    const defaultStyle = `*{
  overflow: hidden;
}
body {
  padding-top: 35px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
  margin: auto;
  max-width: 38rem;
  padding: 2rem;
  background: rgba(1, 13, 35, 1);
  color: white;
}
#background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('https://i.pinimg.com/originals/79/82/a3/7982a35558b9c49bc2e2d169b2ac043b.gif');
  filter: blur(5px);
  z-index: -1;
}
/*Downloader de Musicas*/
.toggle-downloader-btn{
    background: transparent;
    border: none;
    color:white;
    position: absolute;
    left: 15px;
    top: 35px;
    width: 40px;
    height: 40px;
    z-index: 99;
    cursor: pointer;
}

/*Biblioteca de Musicas*/
.library-container{
    position: absolute;
    right: 0;
    top: 0;
    background-color: rgba(3, 34, 63, 0.7);
    box-shadow: #03223F 0px 0px 20px 5px;
    padding: 20px;
    width: 30%;
    height: 96%;
    border-radius: 15px 0 0 15px;
    z-index: 999;
}
.song-grid{
    overflow-y: auto;
    height: 85%;
}
.song-card{
    border: 0px solid white;
    display: flex;
    margin-top: 30px;
    margin-right: 70px;
    margin-left: 30px;
    transition: all 0.2s ease-in-out;
    border-radius: 15px;
}
.song-card:hover{
    transform: scale(1.1);
    border: 3px solid white;
    border-radius: 15px;
    cursor: pointer;
}
.Capa-song{
    width: 10rem;
    height: 10rem;
    border-radius: 15px;
    object-fit: cover;
    margin-right: 30px;
}
.Song-title{
    width: 18rem;
    font-size: 1.3rem;
}
.Song-Artista{
    width: 18rem;
}
/*Player de Musicas*/
.playerContainer{
    width: 70%;
    height: 100%;
    position: absolute;
    left: 0;
    z-index: 2;
}

.visualizer-overlay {
  max-width: 50vw;   /* Não ultrapassa a largura da tela */
  max-height: 90vh;  /* Não ultrapassa a altura da tela */
  width: auto;
  height: auto;
  aspect-ratio: 1 / 1; /* Garante que permaneça um círculo/quadrado */
  cursor: pointer;
}
.capa-wrapper{
   width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.info{
    z-index: 2;
}
.playButton{
    display: none;
}
.navButton.back{
    position: absolute;
    left: 14rem;
    top: 25rem;
    border: none;
    background-color: #91662aff;
    padding: 1.3rem;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    z-index: 4;
    box-shadow: #91662aff 0px 0px 0px 0px;
    transition: all 0.3s ease-in-out;
}
.bi-skip-backward-fill{
    fill: black;
    transition: all 0.3s ease-in-out;
}
.navButton.back:hover .bi-skip-backward-fill,
.navButton.forw:hover .bi-skip-forward-fill{
    fill: white;
}
.bi-skip-forward-fill{
    fill: black;
    transition: all 0.3s ease-in-out;
}
.navButton.back:hover {
    background-color: #e19f41;
    box-shadow: #e19f41 0px 0px 5px 7px;
}
.navButton.forw:hover {
    background-color: #e19f41;
    box-shadow: #e19f41 0px 0px 5px 7px;
}
.navButton.forw{
    position: absolute;
    right: 12rem;
    top: 25rem;
    border: none;
    background-color: #91662aff;
    padding: 1.3rem;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    z-index: 4;
    box-shadow: #91662aff 0px 0px 0px 0px;
    transition: all 0.3s ease-in-out;
}
.progressArea{
    width: 85rem;
    margin-top: 1.3rem;
    z-index: 2;
    position: absolute;
    bottom: 3rem;
    margin-left: 12%;
}
.progressBar{
    all:unset; /* limpa os estilos iniciais */
     border: none;
    display: inline-block;
    height: 0.7rem;
    width: 50rem;
    border-radius: 1rem;
    cursor: pointer;
    margin: 1rem;
    z-index: 2;
}
.progressBar::-webkit-slider-thumb{
    -webkit-appearance: none;
  appearance: none; 
  height: 1.2rem;
  width: 1.2rem;
  background-color: #FCCB6F;
  border-radius: 50%;
  border: none;
  transition: .2s ease-in-out;
}
.title{
    position: absolute;
    top: 0rem;
    width: 100%;
    text-align: center;
    font-size: 2rem;
    font-weight: bold;
    margin-top: 1.3rem;
}
.Cantor{
    position: absolute;
    top: 3rem;
    width: 100%;
    text-align: center;
    font-size: 1.3rem;
    margin-top: 1.3rem;
    color: #CCCCCC;
}
#Aleatorio{
    position: absolute;
    bottom: 5rem;
    left: 0rem;
    background: transparent;
    border: none;
    margin-left: 1.3rem;
    cursor: pointer;
    width: 5rem;
    height: 5rem;
    transition: all 0.3s ease-in-out;
}
#Aleatorio:hover .bi-shuffle{
    background-color: #e19f41;
    box-shadow: #e19f41 0px 0px 5px 7px;
}
#Repetir{
    position: absolute;
    bottom: 5rem;
    left: 5rem;
    background: transparent;
    border: none;
    margin-left: 1.3rem;
    cursor: pointer;
    width: 5rem;
    height: 5rem;
    transition: all 0.3s ease-in-out;
}
.bi-repeat{
    background-color: #91662aff;
    padding: 0.6rem;
    border-radius: 50%;
    border: none;
    width: 2rem;
    height: 2rem;
    fill: black;
    transition: all 0.3s ease-in-out;
}
#Repetir:hover .bi-repeat{
    background-color: #e19f41;
    box-shadow: #e19f41 0px 0px 5px 7px;
}
.volumeControl{
    position: absolute;
    right: 3rem;
    bottom: 7rem;
    display: flex;
    align-items: center;
    z-index: 2;
}
.bi-shuffle{
    background-color: #91662aff;
    padding: 0.6rem;
    border-radius: 50%;
    border: none;
    width: 2rem;
    height: 2rem;
    fill: black;
    transition: all 0.3s ease-in-out;
}
#Aleatorio.active .bi-shuffle{
    background-color: #e19f41;
    fill:white;
}
#Repetir.active .bi-repeat{
    background-color: #e19f41;
    fill:white;
}
.bi-volume{
    fill: #e19f41;
}
.bi-volume.down{
    fill: #91662aff;
}
.volumeBar{
    all:unset; /* limpa os estilos iniciais */
     border: none;
    display: inline-block;
    height: 0.55rem;
    width: 75%;
    border-radius: 1rem;
    cursor: pointer;
    margin: 1rem;
    z-index: 2;
}
.volumeBar::-webkit-slider-thumb{
    -webkit-appearance: none;
  appearance: none; 
  height: 1rem;
  width: 1rem;
  background-color: #FCCB6F;
  border-radius: 50%;
  border: none;
  transition: .2s ease-in-out;
}
.volumeControl{
    width: 13rem;
}
    
/*Controladores do aplicativo*/
.titleBar{ 
    height: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
}
.buttonGroup_windowControls {
    position: absolute;
    right: 0;
    display: flex;
    height: 100%;
    -webkit-app-region: no-drag;
}
.buttonGroup_windowControls button {
    width: 45px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
}
.closeButton:hover {
    background-color: #E81123;
}

.window-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}
.artists{
    overflow-y: auto;
    height: 85%;
    padding: auto;
}
.artist-card{
    border: 0px solid white;
    transition: all 0.2s ease-in-out;
    border-radius: 15px;
}
.artist-card:hover{
    transform: scale(1.1);
    border: 3px solid white;
    border-radius: 15px;
    cursor: pointer;
}
.artist_songs{
    overflow-y: auto;
    height: 70%;
    position: absolute;
    top: 12%;
}
.Button-tabs{
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: space-between;
  width: 50%;
  margin: auto;
  margin-bottom: 20px;
}
.Button-tabs button {
  padding: 20px;
  border-radius: 60px;
  border: none;
  background: #424242;
  color: #e2e2e2;
  cursor: pointer;
  font-size: 16px;
  color: white;
  transition: all 0.3s ease-in-out;
}
.Button-tabs .active-tab{
    background: #e19f41;
    color: rgb(0, 0, 0);
}
.playlists-section{
    position: absolute;
    top: 15%;
    width: 90%;
    height: 85%;
    overflow-y: auto;
}
`;
    fs.writeFileSync(externalCssPath, defaultStyle, 'utf-8');
  }
  protocol.registerFileProtocol('media', (request, callback) => {
  // 1. Remove o protocolo media://
  let filePath = request.url.replace('media://', '');
  
  // 2. Decodifica os espaços e caracteres especiais (ex: %20 -> " ")
  filePath = decodeURIComponent(filePath);

  try {
    // 3. Limpeza para Windows
    // Se a URL vier como media://D:/... o request.url vira "D:/..."
    // Se vier como media:///D:/... o request.url vira "/D:/..."
    // Precisamos garantir que não haja uma barra antes da letra do drive
    if (process.platform === 'win32') {
      // Remove a barra inicial se houver (/D:/projeto -> D:/projeto)
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }
    }

    // 4. Normaliza as barras para o padrão do sistema (\ no Windows)
    const absolutePath = path.normalize(filePath);
    
    // LOG DE DEBUG - Verifique isso no terminal do VS Code!
    console.log("Protocolo Media tentando ler:", absolutePath);

    return callback({ path: absolutePath });
  } catch (error) {
    console.error('Falha no protocolo media:', error);
    return callback({ error: -6 }); // Erro de arquivo não encontrado
  }
});
  createWindow();
  if (process.platform === 'win32') {
    const url = process.argv.find(arg => arg.startsWith('vm://'));
    if (url) {
      // Pequeno delay para garantir que a janela carregou
      setTimeout(() => processarUrlProtocolo(url), 2000);
    }
  }

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  limparCacheCover();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const limparCacheCover = () => {
    try {
      if (fs.existsSync(coverPath)) {
        const files = fs.readdirSync(coverPath);
        for (const file of files) {
          const filePath = path.join(coverPath, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
        console.log("Cache de capas limpo com sucesso.");
      }
    } catch (err) {
      console.error("Erro ao limpar cache de capas:", err);
    }
  }

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


const {ipcMain} = require('electron');
const {spawn} = require('child_process');

[musicPath, coverPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Pasta criada:", dir);
  }
});
function baixarMusica(url, mainWindowSender) {
  console.log("Recebido pedido para baixar:", url);

  if (ytMusicWindow) {
    ytMusicWindow.close();
  }

  // ABRIR A NOVA JANELA DE DOWNLOAD
  createDownloadWindow();

  const ytDlpPath = path.join(binPath, 'yt-dlp.exe');
  const ffmpegPath = path.join(binPath, 'ffmpeg.exe');
  const outputPath = path.join(musicPath, '%(title)s.%(ext)s');

  return new Promise((resolve, reject) => {
    const process = spawn(ytDlpPath, [
      '-x',
      '--audio-format', 'mp3',
      '--ffmpeg-location', ffmpegPath,
      '-o', outputPath,
      '--embed-metadata',
      '--embed-thumbnail',
      '--newline',
      url
    ]);

    process.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/(\d+\.\d+)%/);
      
      if (match) {
        const percent = parseFloat(match[1]);
        
        // ENVIAR O PROGRESSO PARA A JANELA DE DOWNLOAD (se ela existir)
        if (downloadWindow) {
          downloadWindow.webContents.send('download-progress', percent);
        }
      }
      console.log(`Logs: ${output}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        salvarHistorico(url);
        
        // Avisa a janela de download que acabou (para mostrar 100% ou fechar)
        if (downloadWindow) {
           downloadWindow.webContents.send('download-finalizado');
           
           // Opcional: Fechar a janela de download automaticamente após 2 segundos
           setTimeout(() => {
             if (downloadWindow) downloadWindow.close();
           }, 2000);
        }

        // Avisa a JANELA PRINCIPAL para atualizar a lista
        // (Usamos o mainWindowSender que foi passado como argumento)
        if (mainWindowSender) {
            mainWindowSender.send('library-updated');
        }
        
        resolve(musicPath);
      } else {
        if (downloadWindow) downloadWindow.webContents.send('download-error', `Erro: ${code}`);
        reject(`Erro: ${code}`);
      }
    });
  });
}

ipcMain.handle('download-music', async (event, url) => {
  // Passamos o event.sender (que é a janela que clicou no botão)
  return baixarMusica(url, event.sender);
});

const mm = require('music-metadata');

ipcMain.handle('get-library', async () => {
  if (!fs.existsSync(musicPath)) return [];

  const files = fs.readdirSync(musicPath);
  const musicData = [];

  for (const file of files) {
    if (file.toLowerCase().endsWith('.mp3')) {
      const filePath = path.join(musicPath, file);
      try {
        const metadata = await mm.parseFile(filePath);
        const coverFileName = `${path.parse(file).name}.jpg`;
        const absoluteCoverPath = path.join(coverPath, coverFileName);
        const coverFilePath_library = path.join('cache_cover', coverFileName);

        if (!fs.existsSync(absoluteCoverPath) && metadata.common.picture) {
          fs.writeFileSync(absoluteCoverPath, metadata.common.picture[0].data);
        }

        musicData.push({
          id: file,
          title: metadata.common.title || file,
          artist: metadata.common.artist || 'Desconhecido',
          path: filePath,
          player: absoluteCoverPath, // Caminho absoluto para o protocolo media://
          library: coverFilePath_library
        });
      } catch (err) {
        console.error("Erro no arquivo:", file, err);
      }
    }
  }
  return musicData;
});
ipcMain.handle('Youtube-Music', () => {
  YoutubeMusicWindow();
});

const salvarHistorico = (url) => {
  const filePath = path.join(histPath, 'hist.json');
  let historico = [];

  if (fs.existsSync(filePath)){
    const data = fs.readFileSync(filePath, 'utf8');
    historico = JSON.parse(data);
  }

  historico.push({
    url:url,
    data: new Date().toLocaleString()
  });

  fs.writeFileSync(filePath, JSON.stringify(historico, null, 2));
  console.log("Link salvo no Histórico:", filePath);
}
const { Client } = require('@xhayper/discord-rpc');
const client = new Client({ clientId: '1457877451492294789' });

client.on('ready', () => {
    console.log('✅ Conectado via xhayper/discord-rpc');
});

// A vantagem desta biblioteca é que ela gerencia a reconexão muito melhor
client.login().catch(console.error);

ipcMain.on('canal-discord', (event, dados) => {
    if (client.user) { // Verifica se está logado
        client.user.setActivity({
            details: dados.title,
            state: `por ${dados.artist}`,
            type: 2,
            largeImageKey: `https://i.pinimg.com/originals/8a/b4/31/8ab431112b123209806680d879cbd26f.gif`,
            instance: false
        });
    }
});

// --- MENU DE CONTEXTO (ATUALIZADO COM PLAYLISTS) ---
ipcMain.on('show-context-menu', (event, { songId, filePath, playlists, index }) => {
  const template = [
    {
      label: 'Tocar Música',
      click: () => { event.sender.send('menu-play-song', index !== undefined ? index : songId); }
    },
    { type: 'separator' },
    {
      label: 'Adicionar à Playlist...',
      enabled: playlists && playlists.length > 0,
      submenu: playlists ? playlists.map(pl => ({
        label: pl.name,
        click: () => { event.sender.send('add-to-playlist', { playlistId: pl.id, songId: songId }); }
      })) : []
    },
    { type: 'separator' },
    {
      label: 'Mostrar na Pasta',
      click: () => { if (fs.existsSync(filePath)) shell.showItemInFolder(filePath); }
    },
    {
      label: 'Apagar Música',
      click: () => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          event.sender.send('library-updated');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Editar Aparência (CSS)',
      click: () => { shell.openPath(externalCssPath); }
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});
// Este listener recebe o grito do Copy.js
ipcMain.on('url-detectada-pelo-copy', (event, url) => {
    if (ytMusicWindow) ytMusicWindow.close();

    if (mainWindow) {
        // Forçamos o foco na janela principal para o usuário ver o progresso
        mainWindow.focus(); 
        
        baixarMusica(url, mainWindow.webContents)
            .then(() => {
                // Forçamos uma atualização extra por segurança
                mainWindow.webContents.send('library-updated');
            })
            .catch(err => console.error("Falha ao iniciar download:", err));
    }
});

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close', () => mainWindow.close());

// Função auxiliar para processar a URL do protocolo
function processarUrlProtocolo(url) {
  try {
    const urlObj = new URL(url);
    // Se o formato for meu-player-musica://download?url=https://youtube.com...
    if (urlObj.hostname === 'download') {
      const musicUrl = urlObj.searchParams.get('url');
      if (musicUrl && mainWindow) {
        mainWindow.focus();
        baixarMusica(musicUrl, mainWindow.webContents);
      }
    }
  } catch (e) {
    console.error('Erro ao processar URL do protocolo:', e);
  }
}

// Para Windows (Segunda Instância)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // No Windows, a URL completa está nos argumentos
    const url = commandLine.pop();
    if (url.includes('vm://')) {
      processarUrlProtocolo(url);
    }
  });
}
//vm://download?url=
// Para macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  processarUrlProtocolo(url);
});