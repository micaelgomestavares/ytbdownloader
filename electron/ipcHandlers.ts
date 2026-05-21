import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BrowserWindow } from 'electron';
import { app, dialog, ipcMain, shell } from 'electron';
import type DownloadManager from './downloadManager';

interface Settings {
  downloadPath: string;
  quality: string;
  format: string;
  cookiesBrowser?: string;
  cookiesFile?: string;
  isFirstRun?: boolean;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

interface OpenResult {
  success: boolean;
  error?: string;
}

interface FirstRunDialogResult {
  success: boolean;
  path?: string;
  cancelled?: boolean;
  error?: string;
}

function setupIPCHandlers(mainWindow: BrowserWindow, downloadManager: DownloadManager): void {
  // Handlers de sistema
  ipcMain.handle('select-folder', async (_event, title: string) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title,
      properties: ['openDirectory'],
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('select-cookies-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecionar arquivo cookies.txt',
      properties: ['openFile'],
      filters: [
        { name: 'Cookies do Netscape', extensions: ['txt'] },
        { name: 'Todos os arquivos', extensions: ['*'] },
      ],
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('get-app-data-path', (): string => {
    return app.getPath('userData');
  });

  ipcMain.handle('get-downloads-path', (): string => {
    return app.getPath('downloads');
  });

  ipcMain.handle('get-app-version', (): string => {
    return app.getVersion();
  });

  ipcMain.handle('is-dev', (): boolean => {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    return isDev;
  });

  ipcMain.handle('open-dev-tools', (): void => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });

  ipcMain.handle('open-external', async (_event, url: string): Promise<void> => {
    shell.openExternal(url);
  });

  // Handlers de configurações
  ipcMain.handle('save-settings', async (_event, settings: Settings): Promise<SaveResult> => {
    try {
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'settings.json');

      // Garantir que a pasta existe
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      // Salvar configurações
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

      console.log('💾 Configurações salvas:', settings);

      // Se o downloadPath foi alterado e não é o padrão do sistema,
      // também salvar no registro do Windows para futura referência
      if (
        process.platform === 'win32' &&
        settings.downloadPath &&
        settings.downloadPath !== app.getPath('downloads')
      ) {
        try {
          const { execSync } = require('node:child_process');
          const regCmd = `reg add "HKCU\\Software\\YouTube MP3 Converter" /v DownloadFolder /t REG_SZ /d "${settings.downloadPath}" /f`;
          execSync(regCmd, { stdio: 'ignore' });
          console.log('📁 Pasta de downloads salva no registro do Windows');
        } catch (error) {
          console.log('⚠️ Não foi possível salvar no registro:', (error as Error).message);
          // Não falhar se não conseguir salvar no registro
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('load-settings', async (): Promise<Settings | null> => {
    try {
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'settings.json');

      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(data);
      }

      return {
        downloadPath: app.getPath('downloads'),
        quality: 'best',
        format: 'mp3',
        cookiesBrowser: 'none',
        cookiesFile: '',
      };
    } catch {
      return null;
    }
  });

  ipcMain.handle('get-settings', async (): Promise<Settings> => {
    try {
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'settings.json'); // Configurações padrão
      const defaultSettings: Settings = {
        downloadPath: app.getPath('downloads'),
        quality: 'best',
        format: 'mp3',
        cookiesBrowser: 'none',
        cookiesFile: '',
        isFirstRun: false,
      };

      // Verificar se é primeira execução (não existe settings.json)
      const isFirstRun = !fs.existsSync(settingsPath);
      if (isFirstRun) {
        defaultSettings.isFirstRun = true;
        console.log('🎯 Primeira execução detectada');
      }

      // No Windows, verificar se existe configuração do instalador no registro
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('node:child_process');
          const regQuery = 'reg query "HKCU\\Software\\YouTube MP3 Converter" /v DownloadFolder';
          const result = execSync(regQuery, {
            encoding: 'utf8',
            stdio: 'pipe',
          }); // Extrair o caminho da pasta do resultado do registro
          const match = result.match(/DownloadFolder\s+REG_SZ\s+(.+)/);
          if (match?.[1]) {
            const installerPath = match[1].trim();
            if (fs.existsSync(installerPath)) {
              defaultSettings.downloadPath = installerPath;
              console.log('📁 Usando pasta de downloads do instalador:', installerPath);
            }
          }
        } catch {
          // Ignorar erro se não conseguir ler o registro (instalador não usado)
          console.log('📁 Usando pasta padrão de downloads');
        }
      }

      // Verificar se existe arquivo de configurações salvo
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        const savedSettings = JSON.parse(data);

        // Verificar se a pasta salva ainda existe
        if (savedSettings.downloadPath && !fs.existsSync(savedSettings.downloadPath)) {
          console.log('⚠️ Pasta salva não existe mais, usando pasta padrão');
          savedSettings.downloadPath = app.getPath('downloads');

          // Salvar a correção
          fs.writeFileSync(settingsPath, JSON.stringify(savedSettings, null, 2));
        }

        // Mesclar configurações salvas com padrões
        return { ...defaultSettings, ...savedSettings, isFirstRun: false };
      }

      return defaultSettings;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return {
        downloadPath: app.getPath('downloads'),
        quality: 'best',
        format: 'mp3',
        cookiesBrowser: 'none',
        cookiesFile: '',
      };
    }
  });

  // Handlers de pasta/arquivo
  ipcMain.handle('show-in-folder', async (_event, filePath: string): Promise<OpenResult> => {
    try {
      if (!filePath) {
        // Se não há path específico, abrir a pasta de downloads padrão
        const defaultPath = app.getPath('downloads');
        shell.showItemInFolder(defaultPath);
        return { success: true };
      }

      // Verificar se o arquivo existe
      if (fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return { success: true };
      } else {
        // Se o arquivo não existe, abrir a pasta pai
        const dir = path.dirname(filePath);
        if (fs.existsSync(dir)) {
          shell.openPath(dir);
          return { success: true };
        } else {
          // Fallback para pasta de downloads
          const defaultPath = app.getPath('downloads');
          shell.openPath(defaultPath);
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('open-folder', async (_event, folderPath: string): Promise<OpenResult> => {
    try {
      // Verificar se a pasta existe
      if (fs.existsSync(folderPath)) {
        // Usar openPath para abrir diretamente a pasta
        await shell.openPath(folderPath);
        return { success: true };
      } else {
        // Se a pasta não existe, usar pasta padrão
        const defaultPath = app.getPath('downloads');
        await shell.openPath(defaultPath);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('show-first-run-dialog', async (): Promise<FirstRunDialogResult> => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Escolher Pasta de Downloads',
        message: 'Escolha onde você deseja salvar os arquivos MP3 baixados:',
        properties: ['openDirectory'],
        defaultPath: app.getPath('documents'),
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];

        // Salvar no registro do Windows
        if (process.platform === 'win32') {
          try {
            const { execSync } = require('node:child_process');
            const regCmd = `reg add "HKCU\\Software\\YouTube MP3 Converter" /v DownloadFolder /t REG_SZ /d "${selectedPath}" /f`;
            execSync(regCmd, { stdio: 'ignore' });
            console.log('📁 Nova pasta de downloads salva no registro:', selectedPath);
          } catch (error) {
            console.log('⚠️ Não foi possível salvar no registro:', (error as Error).message);
          }
        }

        return { success: true, path: selectedPath };
      }

      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Erro ao mostrar diálogo de primeira execução:', error);
      return { success: false, error: (error as Error).message };
    }
  });
  // Handlers de download
  ipcMain.handle('add-download', async (_event, url: string, options: any): Promise<string> => {
    return downloadManager.addDownload(url, options);
  });

  ipcMain.handle('cancel-download', async (_event, id: string): Promise<boolean> => {
    return downloadManager.cancelDownload(id);
  });

  ipcMain.handle('get-downloads', async (): Promise<any[]> => {
    return downloadManager.getDownloads();
  });

  ipcMain.handle('remove-download', async (_event, id: string): Promise<boolean> => {
    return downloadManager.removeDownload(id);
  });

  ipcMain.handle('get-video-info', async (_event, url: string, options: any): Promise<any> => {
    return downloadManager.getVideoInfo(url, options);
  });

  ipcMain.handle('get-playlist-count', async (_event, url: string): Promise<number> => {
    return downloadManager.getPlaylistCount(url);
  });

  ipcMain.handle('start-download', async (_event, url: string, options: any): Promise<string> => {
    return downloadManager.addDownload(url, options);
  });

  ipcMain.handle('pause-download', async (_event, id: string): Promise<boolean> => {
    return downloadManager.pauseDownload(id);
  });

  ipcMain.handle('resume-download', async (_event, id: string): Promise<boolean> => {
    return downloadManager.resumeDownload(id);
  });
}

export default setupIPCHandlers;
