const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Importar módulos separados
const DownloadManager = require('./downloadManager');
const setupIPCHandlers = require('./ipcHandlers');

// Carregar variáveis de ambiente (opcional em produção)
try {
  require('dotenv').config();
} catch (error) {
  // Em produção, dotenv pode não estar disponível - isso é normal
  console.log('dotenv não disponível, usando variáveis padrão');
}

// Configuração da aplicação
let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const REACT_DEV_PORT = process.env.REACT_DEV_PORT || 3000;
const ELECTRON_REACT_TIMEOUT = parseInt(process.env.ELECTRON_REACT_TIMEOUT) || 8000;

// Instanciar o gerenciador de downloads
const downloadManager = new DownloadManager();

function createWindow() {
  // Definir o caminho correto do ícone baseado no ambiente
  let iconPath;

  if (app.isPackaged) {
    // Em produção, testar caminhos possíveis até encontrar o ícone
    const possibleIconPaths = [
      path.join(process.resourcesPath, 'assets', 'favicon.ico'),
      path.join(process.resourcesPath, '..', 'assets', 'favicon.ico'),
      path.join(__dirname, '..', 'assets', 'favicon.ico'),
      path.join(process.cwd(), 'assets', 'favicon.ico')
    ];

    for (const testPath of possibleIconPaths) {
      if (fs.existsSync(testPath)) {
        iconPath = testPath;
        break;
      }
    }

    // Se não encontrou, usar um caminho padrão
    if (!iconPath) {
      iconPath = path.join(process.resourcesPath, 'assets', 'favicon.ico');
    }
  } else {
    // Em desenvolvimento, o ícone fica na pasta assets do projeto
    iconPath = path.join(__dirname, '..', 'assets', 'favicon.ico');
  }

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Enabled for security
      allowRunningInsecureContent: false,
      devTools: isDev, // Habilitar DevTools apenas em desenvolvimento
    },
    icon: iconPath, // Ícone personalizado com caminho correto
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    simpleFullscreen: true,
    autoHideMenuBar: true,
  });

  if (isDev) {
    setTimeout(() => {
      mainWindow.loadURL(`http://localhost:${REACT_DEV_PORT}`)
        .then(() => {
          console.log('✅ Página React carregada com sucesso');
          mainWindow.webContents.openDevTools();
        })
        .catch((error) => {
          console.error('❌ Erro ao carregar React:', error);
          // Fallback para arquivo estático se o servidor não estiver funcionando
          const htmlPath = path.join(__dirname, '..', 'build', 'index.html');
          if (fs.existsSync(htmlPath)) {
            mainWindow.loadFile(htmlPath);
          }
        });
    }, ELECTRON_REACT_TIMEOUT);
  } else {
    const htmlPath = path.join(process.resourcesPath, 'app.asar', 'build', 'index.html');

    console.log('📂 Carregando HTML de:', htmlPath);
    console.log('📂 Arquivo existe?', fs.existsSync(htmlPath));
    mainWindow.loadFile(htmlPath);
  }
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      console.log('🚀 Janela pronta, carregando React...');
    }
  });

  // Configurar o downloadManager com a referência da janela
  downloadManager.setMainWindow(mainWindow);

  // Configurar handlers do IPC
  setupIPCHandlers(mainWindow, downloadManager);

  // Debug: Log quando a página carrega
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página carregada com sucesso');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('❌ Erro ao carregar página:', errorCode, errorDescription);
  });
}

// Event listeners do Electron
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
