const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { app } = require('electron');

class DownloadManager {
  constructor() {
    this.downloads = new Map();
    this.processes = new Map();
    this.ytDlpPath = this.findYtDlp();
    this.mainWindow = null;
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  findYtDlp() {
    // Primeiro, tentar usar o binário incluído no app
    const appPath = app.isPackaged
      ? path.join(process.resourcesPath, 'binaries')
      : path.join(__dirname, '..', 'binaries');

    const bundledYtDlp = path.join(appPath, 'yt-dlp.exe');

    if (fs.existsSync(bundledYtDlp)) {
      console.log('✅ Usando yt-dlp incluído:', bundledYtDlp);
      return bundledYtDlp;
    }

    // Fallback para yt-dlp instalado no sistema
    const systemPaths = [
      'yt-dlp',
      'yt-dlp.exe',
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python*', 'Scripts', 'yt-dlp.exe'),
      path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'Python', 'Python*', 'Scripts', 'yt-dlp.exe')
    ];

    for (const ytdlpPath of systemPaths) {
      try {
        const { execSync } = require('child_process');
        execSync(`"${ytdlpPath}" --version`, { stdio: 'ignore' });
        console.log('✅ Usando yt-dlp do sistema:', ytdlpPath);
        return ytdlpPath;
      } catch (e) {
        continue;
      }
    }

    console.log('❌ yt-dlp não encontrado');
    return null;
  }

  addDownload(url, options = {}) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const download = {
      id,
      url,
      progress: 0,
      status: 'pending',
      title: options.title || '',
      uploader: options.uploader || '',
      duration: options.duration || '',
      speed: '',
      eta: ''
    };

    this.downloads.set(id, download);
    this.startDownload(id, options);
    return id;
  }

  startDownload(id, options = {}) {
    const download = this.downloads.get(id);
    if (!download) return;

    download.status = 'downloading';
    this.downloads.set(id, download);

    // Define default values for options
    const outputPath = options.outputPath || app.getPath('downloads');
    const quality = options.quality || 'best';
    const format = options.format || 'mp3';

    const args = [
      download.url,
      '--format', this.getFormatString(quality, format),
      '--output', path.join(outputPath, '%(title)s.%(ext)s'),
      '--progress',
      '--newline',
      '--no-warnings',
      '--socket-timeout', '30',        // Timeout de socket para conexões instáveis      
      '--retries', '5',                // Mais tentativas em caso de falha
      '--fragment-retries', '5',       // Tentativas para fragmentos
      '--retry-sleep', '1',            // Tempo entre tentativas
      '--continue',                    // Continuar downloads interrompidos
      '--no-abort-on-unavailable-fragment' // Não abortar por fragmentos indisponíveis
    ];

    const process = spawn(this.ytDlpPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 0,  // Sem timeout para o processo (deixar o yt-dlp gerenciar)
      detached: false,
      windowsHide: true // Esconder janela do processo no Windows
    });

    this.processes.set(id, process);

    process.stdout.on('data', (data) => {
      const output = data.toString();
      this.parseProgress(id, output);

      // Notificar o frontend sobre o progresso
      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-progress', {
          id,
          ...this.downloads.get(id)
        });
      }
    });

    process.stderr.on('data', (data) => {
      console.error('yt-dlp error:', data.toString());
    });

    process.on('close', (code) => {
      this.processes.delete(id);

      if (code === 0) {
        download.status = 'completed';
        download.progress = 100;

        // Manter o download na lista após completar
        this.downloads.set(id, download);

        if (this.mainWindow) {
          // Simular um pequeno delay para melhor UX
          setTimeout(() => {
            this.mainWindow.webContents.send('download-complete', {
              id,
              ...download,
              outputFile: 'Download concluído com sucesso'
            });
          }, 1500);
        }
      } else {
        download.status = 'error';
        download.error = `Download failed with code ${code}`;
        this.downloads.set(id, download);

        if (this.mainWindow) {
          this.mainWindow.webContents.send('download-error', {
            id,
            ...download
          });
        }
      }
    });

    process.on('error', (error) => {
      this.processes.delete(id);
      download.status = 'error';
      download.error = error.message;
      this.downloads.set(id, download);

      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-error', {
          id,
          ...download
        });
      }
    });
  }

  parseProgress(id, output) {
    const download = this.downloads.get(id);
    if (!download) return;

    const lines = output.split('\n');
    lines.forEach(line => {
      if (line.includes('[download]')) {
        const progressMatch = line.match(/(\d+\.?\d*)%/);
        if (progressMatch) {
          const rawProgress = parseFloat(progressMatch[1]);

          // Simular progresso mais gradual para melhor UX
          if (rawProgress === 100) {
            // Ao chegar em 100%, manter visível por um tempo
            download.progress = 99.8;
            setTimeout(() => {
              download.progress = 100;
              download.status = 'completed';
              this.downloads.set(id, download);

              if (this.mainWindow) {
                this.mainWindow.webContents.send('download-progress', {
                  id,
                  ...download
                });

                // Aguardar mais um pouco antes de marcar como completo
                setTimeout(() => {
                  this.mainWindow.webContents.send('download-complete', {
                    id,
                    ...download
                  });
                }, 1000);
              }
            }, 2000);
          } else {
            download.progress = rawProgress;
          }
        }

        const speedMatch = line.match(/at\s+([^\s]+\/s)/);
        if (speedMatch) {
          download.speed = speedMatch[1];
        }

        const etaMatch = line.match(/ETA\s+([^\s]+)/);
        if (etaMatch) {
          download.eta = etaMatch[1];
        }
      }

      if (line.includes('[info]') && line.includes('title')) {
        const titleMatch = line.match(/title:\s+(.+)/);
        if (titleMatch) {
          download.title = titleMatch[1];
        }
      }
    });

    this.downloads.set(id, download);
  }

  getFormatString(quality, format) {
    switch (quality) {
      case 'best':
        return format === 'mp3' ? 'bestaudio/best' : 'best';
      case 'worst':
        return format === 'mp3' ? 'worstaudio/worst' : 'worst';
      default:
        return `best[height<=${quality}]`;
    }
  }

  cancelDownload(id) {
    const process = this.processes.get(id);
    if (process) {
      process.kill();
      this.processes.delete(id);

      const download = this.downloads.get(id);
      if (download) {
        download.status = 'cancelled';
        this.downloads.set(id, download);
      }
      return true;
    }
    return false;
  }

  getDownloads() {
    return Array.from(this.downloads.values());
  }

  removeDownload(id) {
    this.cancelDownload(id);
    return this.downloads.delete(id);
  }

  async getVideoInfo(url) {
    if (!this.ytDlpPath) {
      throw new Error('yt-dlp não encontrado');
    }

    return new Promise((resolve, reject) => {
      const args = [
        url,
        '--dump-json',
        '--no-warnings',
        '--skip-download'
      ];

      const process = spawn(this.ytDlpPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0 && output.trim()) {
          try {
            const info = JSON.parse(output.trim());
            resolve({
              title: info.title || 'Título não disponível',
              uploader: info.uploader || info.channel,
              duration: this.formatDuration(info.duration),
              thumbnail: info.thumbnail
            });
          } catch (error) {
            reject(new Error('Erro ao processar informações do vídeo'));
          }
        } else {
          reject(new Error('Erro ao obter informações do vídeo: ' + errorOutput));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });

      // Timeout aumentado para 60 segundos para vídeos longos
      setTimeout(() => {
        process.kill();
        reject(new Error('Timeout ao obter informações do vídeo (60s)'));
      }, 60000); // Aumentado de 10s para 60s
    });
  }

  formatDuration(seconds) {
    if (!seconds) return '';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  pauseDownload(id) {
    // Implementação para pausar download se necessário
    return this.cancelDownload(id);
  }

  resumeDownload(id) {
    // Implementação para retomar download se necessário
    const download = this.downloads.get(id);
    if (download && download.status === 'cancelled') {
      download.status = 'pending';
      this.downloads.set(id, download);
      this.startDownload(id);
      return true;
    }
    return false;
  }
}

module.exports = DownloadManager;
