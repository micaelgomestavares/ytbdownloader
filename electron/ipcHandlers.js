const { ipcMain, dialog, shell, app } = require('electron');
const fs = require('fs');
const path = require('path');

function setupIPCHandlers(mainWindow, downloadManager) {
  // Handlers de sistema
  ipcMain.handle('select-folder', async (event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title,
      properties: ['openDirectory']
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('get-app-data-path', () => {
    return app.getPath('userData');
  });

  ipcMain.handle('get-downloads-path', () => {
    return app.getPath('downloads');
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('is-dev', () => {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    return isDev;
  });

  ipcMain.handle('open-dev-tools', () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });

  ipcMain.handle('open-external', async (event, url) => {
    shell.openExternal(url);
  });

  // Handlers de configurações
  ipcMain.handle('save-settings', async (event, settings) => {
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
      if (process.platform === 'win32' && settings.downloadPath && settings.downloadPath !== app.getPath('downloads')) {
        try {
          const { execSync } = require('child_process');
          const regCmd = `reg add "HKCU\\Software\\YouTube MP3 Converter" /v DownloadFolder /t REG_SZ /d "${settings.downloadPath}" /f`;
          execSync(regCmd, { stdio: 'ignore' });
          console.log('📁 Pasta de downloads salva no registro do Windows');
        } catch (error) {
          console.log('⚠️ Não foi possível salvar no registro:', error.message);
          // Não falhar se não conseguir salvar no registro
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-settings', async () => {
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
        format: 'mp3'
      };
    } catch (error) {
      return null;
    }
  });

  ipcMain.handle('get-settings', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'settings.json');

      // Configurações padrão
      let defaultSettings = {
        downloadPath: app.getPath('downloads'),
        quality: 'best',
        format: 'mp3',
        isFirstRun: false
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
          const { execSync } = require('child_process');
          const regQuery = 'reg query "HKCU\\Software\\YouTube MP3 Converter" /v DownloadFolder';
          const result = execSync(regQuery, { encoding: 'utf8', stdio: 'pipe' });

          // Extrair o caminho da pasta do resultado do registro
          const match = result.match(/DownloadFolder\s+REG_SZ\s+(.+)/);
          if (match && match[1]) {
            const installerPath = match[1].trim();
            if (fs.existsSync(installerPath)) {
              defaultSettings.downloadPath = installerPath;
              console.log('📁 Usando pasta de downloads do instalador:', installerPath);
            }
          }
        } catch (error) {
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
        format: 'mp3'
      };
    }
  });

  // Handlers de pasta/arquivo
  ipcMain.handle('show-in-folder', async (event, filePath) => {
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
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-folder', async (event, folderPath) => {
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
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('show-first-run-dialog', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Escolher Pasta de Downloads',
        message: 'Escolha onde você deseja salvar os arquivos MP3 baixados:',
        properties: ['openDirectory'],
        defaultPath: app.getPath('documents')
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];

        // Salvar no registro do Windows
        if (process.platform === 'win32') {
          try {
            const { execSync } = require('child_process');
            const regCmd = `reg add "HKCU\\Software\\YouTube MP3 Converter" /v DownloadFolder /t REG_SZ /d "${selectedPath}" /f`;
            execSync(regCmd, { stdio: 'ignore' });
            console.log('📁 Nova pasta de downloads salva no registro:', selectedPath);
          } catch (error) {
            console.log('⚠️ Não foi possível salvar no registro:', error.message);
          }
        }

        return { success: true, path: selectedPath };
      }

      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Erro ao mostrar diálogo de primeira execução:', error);
      return { success: false, error: error.message };
    }
  });

  // Handlers de download
  ipcMain.handle('add-download', async (event, url, options) => {
    return downloadManager.addDownload(url, options);
  });

  ipcMain.handle('cancel-download', async (event, id) => {
    return downloadManager.cancelDownload(id);
  });

  ipcMain.handle('get-downloads', async () => {
    return downloadManager.getDownloads();
  });

  ipcMain.handle('remove-download', async (event, id) => {
    return downloadManager.removeDownload(id);
  });

  ipcMain.handle('get-video-info', async (event, url) => {
    return downloadManager.getVideoInfo(url);
  });

  ipcMain.handle('start-download', async (event, url, options) => {
    return downloadManager.addDownload(url, options);
  });

  ipcMain.handle('pause-download', async (event, id) => {
    return downloadManager.pauseDownload(id);
  });

  ipcMain.handle('resume-download', async (event, id) => {
    return downloadManager.resumeDownload(id);
  });
}

module.exports = setupIPCHandlers;
