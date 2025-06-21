import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BrowserWindow } from 'electron';
import { app, BrowserWindow as ElectronBrowserWindow } from 'electron';

// Importar módulos separados
import DownloadManager from './downloadManager';
import setupIPCHandlers from './ipcHandlers';

// Carregar variáveis de ambiente (opcional em produção)
try {
  require('dotenv').config();
} catch {
  // Em produção, dotenv pode não estar disponível - isso é normal
  console.log('dotenv não disponível, usando variáveis padrão');
}

// Configuração da aplicação
let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Instanciar o gerenciador de downloads
const downloadManager = new DownloadManager();

function createWindow(): void {
  // Definir o caminho correto do ícone baseado no ambiente
  let iconPath: string | undefined;

  if (app.isPackaged) {
    // Em produção, testar caminhos possíveis até encontrar o ícone
    const possibleIconPaths = [
      path.join(process.resourcesPath, 'assets', 'favicon.ico'),
      path.join(process.resourcesPath, '..', 'assets', 'favicon.ico'),
      path.join(__dirname, '..', 'assets', 'favicon.ico'),
      path.join(process.cwd(), 'assets', 'favicon.ico'),
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
    iconPath = path.join(__dirname, '..', '..', 'assets', 'favicon.ico');
  }

  mainWindow = new ElectronBrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Enabled for security
      allowRunningInsecureContent: false,
      devTools: isDev, // Habilitar DevTools apenas em desenvolvimento
    },
    icon: iconPath, // Ícone personalizado com caminho correto
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
  });

  // Maximizar a janela após criação
  mainWindow.maximize();

  if (isDev) {
    // Em desenvolvimento, tentar primeiro o servidor React, senão fallback para build
    const htmlPath = path.join(__dirname, '..', '..', 'build', 'index.html');
    
    if (fs.existsSync(htmlPath)) {
      console.log('📂 Carregando HTML estático de:', htmlPath);
      mainWindow.loadFile(htmlPath);
    } else {
      console.log('❌ Arquivo HTML não encontrado em:', htmlPath);
    }
  } else {
    // Em produção, carregar do build local
    const htmlPath = path.join(__dirname, '..', '..', 'build', 'index.html');
    
    console.log('📂 Carregando HTML de:', htmlPath);
    console.log('📂 Arquivo existe?', fs.existsSync(htmlPath));
    
    if (fs.existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath);
    } else {
      console.log('❌ Arquivo HTML não encontrado!');
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
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
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.log('❌ Erro ao carregar página:', errorCode, errorDescription);
  });
}

// Event listeners do Electron
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (ElectronBrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
