import { app, BrowserWindow, protocol, Menu, shell } from 'electron';
import path from 'node:path';
const started = require('electron-squirrel-startup');
import fs from 'fs';
import axios from 'axios';

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

const videoPath = isPackaged ? path.join(process.resourcesPath, 'videos' ) : path.join(app.getAppPath(), 'videos');

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
let YtWindow = null;
const createYtWindow = (songName = "") => {
  if (YtWindow) {
    YtWindow.focus();
    return;
  }
    YtWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'default',
    autoHideMenuBar:true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:youtube', // Isola os cookies/cache do YouTube do restante do app

      preload: path.join(__dirname, 'Copy Youtube.js') // Preload para comunicação segura
    }
  });
  const baseURL = 'https://www.youtube.com/';
  const finalURL = songName 
    ? `${baseURL}results?search_query=${encodeURIComponent(songName)}` 
    : baseURL;

  YtWindow.loadURL(finalURL, {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  // Limpa a referência quando a janela for fechada manualmente
  YtWindow.on('closed', () => {
    YtWindow = null;
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
  // Define onde está o CSS original (ajuste o caminho se necessário)
  // Em ambiente de desenvolvimento (Vite), ele geralmente está na pasta renderer
  const originalCssPath = isPackaged 
    ? path.join(__dirname, `../build/index.css`) // Caminho no build
    : path.join(app.getAppPath(), 'src','index.css'); // Ajuste para seu caminho de dev

  // Se o arquivo do usuário não existir, tentamos copiar o original
  if (!fs.existsSync(externalCssPath)) {
    try {
      if (fs.existsSync(originalCssPath)) {
        // Lê o original e escreve o novo
        const originalContent = fs.readFileSync(originalCssPath, 'utf-8');
        fs.writeFileSync(externalCssPath, originalContent, 'utf-8');
        console.log("CSS original copiado para user-style.css");
      } else {
        // Fallback: Se não achar o arquivo, cria um básico para não quebrar
        fs.writeFileSync(externalCssPath, "body { background: #000; color: #fff; }", 'utf-8');
        console.warn("Aviso: index.css original não encontrado em:", originalCssPath);
      }
    } catch (err) {
      console.error("Erro ao copiar arquivo de estilo:", err);
    }
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

[musicPath, coverPath, videoPath].forEach(dir => {
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

        if (mainWindowSender && !mainWindowSender.isDestroyed()) {

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
function baixarVideo(url, customName, mainWindowSender) {
  console.log("Baixando VÍDEO de:", url, "com nome:", customName);

  if (YtWindow) YtWindow.close(); // Fecha a janela do YT ao iniciar
  createDownloadWindow();

  const yt_cookies = path.join(binPath, 'cookies-yt.txt');
  const ytDlpPath = path.join(binPath, 'yt-dlp.exe');
  const ffmpegPath = path.join(binPath, 'ffmpeg.exe');

  // Lógica de renomeação:
  // Se customName for "MinhaMusica.mp3", vira "MinhaMusica"
  const fileNameWithoutExt = customName ? path.parse(customName).name : '%(title)s';
  const outputPath = path.join(videoPath, `${fileNameWithoutExt}.%(ext)s`);

  return new Promise((resolve, reject) => {
    const process = spawn(ytDlpPath, [
      '--ffmpeg-location', ffmpegPath,
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '-o', outputPath,
      '--cookies',
      yt_cookies,
      '--newline',
      url
    ]);

    process.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/(\d+\.\d+)%/);
      if (match && downloadWindow) {
        downloadWindow.webContents.send('download-progress', parseFloat(match[1]));
      }
    });

    process.on('close', (code) => {
      if (code === 0) {
        if (downloadWindow) {
           downloadWindow.webContents.send('download-finalizado');
           
           // Opcional: Fechar a janela de download automaticamente após 2 segundos
           setTimeout(() => {
             if (downloadWindow) downloadWindow.close();
           }, 2000);
        }
        
        // Avisa a JANELA PRINCIPAL para atualizar a lista
        // (Usamos o mainWindowSender que foi passado como argumento)
        if (mainWindowSender && !mainWindowSender.isDestroyed()) {
            mainWindowSender.send('library-updated');
        }
        resolve(videoPath);
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
const offsetsPath = path.join(histPath, 'offsets.json');

// Função auxiliar para salvar o offset
const salvarOffset = (songId, seconds) => {
    let offsets = {};
    if (fs.existsSync(offsetsPath)) {
        offsets = JSON.parse(fs.readFileSync(offsetsPath, 'utf8'));
    }
    offsets[songId] = parseFloat(seconds);
    fs.writeFileSync(offsetsPath, JSON.stringify(offsets, null, 2));
};

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

        const videoFileName = `${path.parse(file).name}.mp4`;
        const absoluteVideoPath = path.join(videoPath, videoFileName);
        const hasVideo = fs.existsSync(absoluteVideoPath);
        const offsets = fs.existsSync(offsetsPath) ? JSON.parse(fs.readFileSync(offsetsPath, 'utf8')) : {};

        if (!fs.existsSync(absoluteCoverPath) && metadata.common.picture) {
          fs.writeFileSync(absoluteCoverPath, metadata.common.picture[0].data);
        }

        musicData.push({
          id: file,
          title: metadata.common.title || file,
          artist: metadata.common.artist || 'Desconhecido',
          img_data: metadata.common.picture[0].data || '',
          path: filePath,
          player: absoluteCoverPath, // Caminho absoluto para o protocolo media://
          library: coverFilePath_library,
          videoPath: hasVideo ? absoluteVideoPath : null,
          offset: offsets[file] || 0
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

ipcMain.handle('download-video', async (event, { url, fileName }) => {
  return baixarVideo(url, fileName, event.sender);
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

ipcMain.on('canal-discord', async (event, dados) => {
    if (client.user) {
        const agora = Math.floor(Date.now() / 1000); // Segundos atuais
        const duracao = Math.floor(dados.duration);
        const tempoAtual = Math.floor(dados.currentTime);

        let capaUrl = 'app_logo';

        try {
          const termoBusca = encodeURIComponent(`${dados.artist} ${dados.title}`);
          const res = await axios.get(`https://itunes.apple.com/search?term=${termoBusca}&entity=song&limit=1`);

          if (res.data.results.length > 0) {
            capaUrl = res.data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
          }
        }catch (err) {
          console.error("Erro ao buscar capa para o Discord:", err);
        }

        const atividade = {
            details: dados.title,
            state: `por ${dados.artist}`,
            type: 2,
            largeImageKey: capaUrl,
            largeImageText: dados.title,
            instance: false,
        };

        if (dados.isPaused) {
            // Se pausar, removemos os timestamps para a barra sumir/parar
            atividade.smallImageKey = 'pause-icon'; 
            atividade.smallImageText = 'Pausado';
            atividade.startTimestamp = agora - tempoAtual;
            atividade.endTimestamp = undefined; // Sem endTimestamp, a barra de progresso desaparece
        } else if (duracao > 0) {
            atividade.smallImageKey = 'play-icon'; 
            atividade.smallImageText = 'Ouvindo agora';
            // Cálculo profissional de progresso:
            // O startTimestamp diz ao Discord quando a música "começou"
            // Se estou em 10s de música, ela começou (agora - 10s) atrás.
            atividade.startTimestamp = agora - tempoAtual;
            atividade.endTimestamp = atividade.startTimestamp + duracao;
        }

        client.user.setActivity(atividade);
    }
});
// --- MENU DE CONTEXTO (ATUALIZADO COM PLAYLISTS) ---
ipcMain.on('show-context-menu', (event, { songId, filePath, playlists, index }) => {
  // 1. LER OS OFFSETS AQUI DENTRO PARA EVITAR O ERRO DE "UNDEFINED"
  let currentOffsets = {};
  try {
    if (fs.existsSync(offsetsPath)) {
      const data = fs.readFileSync(offsetsPath, 'utf8');
      currentOffsets = JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro ao ler offsets.json:", err);
  }
  
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
    {
      label: 'Baixar Versão em Vídeo',
      click: () => { 
        const cleanSongName = path.parse(songId).name; // Remove a extensão para uma busca mais limpa
        // Aqui você precisaria ter a URL original guardada no objeto da música
        // Se não tiver, essa opção é melhor usada direto na janela do YouTube Music
        createYtWindow(cleanSongName);

        if (YtWindow) {
        YtWindow.webContents.on('did-finish-load', () => {
            YtWindow.webContents.send('target-filename', songId);
        });
    }
      }
    },
    { type: 'separator' },
    {
      label: 'Ajustar Sincronização (Offset)',
      click: () => {
        // 2. USAR A VARIÁVEL QUE ACABAMOS DE CRIAR ACIMA
        event.sender.send('request-offset-input', { 
          songId, 
          currentOffset: currentOffsets[songId] || 0 
        });
      }
    },
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

ipcMain.on('save-song-offset', (event, { songId, seconds }) => {
  salvarOffset(songId, seconds);
  event.sender.send('library-updated');
})