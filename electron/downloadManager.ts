import { type ChildProcess, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { BrowserWindow } from 'electron';
import { app } from 'electron';

interface DownloadOptions {
  title?: string;
  uploader?: string;
  duration?: string;
  outputPath?: string;
  quality?: string;
  format?: string;
}

interface Download {
  id: string;
  url: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'cancelled';
  title: string;
  uploader: string;
  duration: string;
  speed: string;
  eta: string;
  error?: string;
}

interface VideoInfo {
  title: string;
  uploader?: string;
  duration: string;
  thumbnail?: string;
}

class DownloadManager {
  private downloads: Map<string, Download> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private ytDlpPath: string | null;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.ytDlpPath = this.findYtDlp();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private findYtDlp(): string | null {
    // Primeiro, tentar usar o binário incluído no app
    let appPath: string;

    if (app.isPackaged) {
      // Em produção empacotada
      appPath = path.join(process.resourcesPath, 'binaries');
    } else {
      // Em desenvolvimento, o arquivo compilado está em dist/electron
      // então precisa voltar duas pastas para chegar na raiz do projeto
      appPath = path.join(__dirname, '..', '..', 'binaries');
    }

    const bundledYtDlp = path.join(appPath, 'yt-dlp.exe');

    console.log('🔍 Procurando yt-dlp em:', bundledYtDlp);
    console.log('🔍 Arquivo existe?', fs.existsSync(bundledYtDlp));

    if (fs.existsSync(bundledYtDlp)) {
      console.log('✅ Usando yt-dlp incluído:', bundledYtDlp);
      return bundledYtDlp;
    }

    // Fallback para yt-dlp instalado no sistema
    const systemPaths = [
      'yt-dlp',
      'yt-dlp.exe',
      path.join(
        os.homedir(),
        'AppData',
        'Local',
        'Programs',
        'Python',
        'Python*',
        'Scripts',
        'yt-dlp.exe',
      ),
      path.join(
        process.env.USERPROFILE || '',
        'AppData',
        'Local',
        'Programs',
        'Python',
        'Python*',
        'Scripts',
        'yt-dlp.exe',
      ),
    ];

    for (const ytdlpPath of systemPaths) {
      try {
        const { execSync } = require('node:child_process');
        execSync(`"${ytdlpPath}" --version`, { stdio: 'ignore' });
        console.log('✅ Usando yt-dlp do sistema:', ytdlpPath);
        return ytdlpPath;
      } catch {}
    }

    console.log('❌ yt-dlp não encontrado');
    return null;
  }

  addDownload(url: string, options: DownloadOptions = {}): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const download: Download = {
      id,
      url,
      progress: 0,
      status: 'pending',
      title: options.title || '',
      uploader: options.uploader || '',
      duration: options.duration || '',
      speed: '',
      eta: '',
    };

    this.downloads.set(id, download);
    this.startDownload(id, options);
    return id;
  }
  private startDownload(id: string, options: DownloadOptions = {}): void {
    const download = this.downloads.get(id);
    if (!download || !this.ytDlpPath) return;

    download.status = 'downloading';
    this.downloads.set(id, download);

    // Define default values for options
    const outputPath = options.outputPath || app.getPath('downloads');
    const quality = options.quality || 'best';
    const format = options.format || 'mp3';

    // Detectar se é uma playlist
    const isPlaylist = download.url.includes('playlist?list=') || download.url.includes('&list=');

    const args = [
      download.url,
      '--format',
      this.getFormatString(quality, format),
      '--output',
      path.join(outputPath, '%(title)s.%(ext)s'),
      '--progress',
      '--newline',
      '--no-warnings',
      '--socket-timeout',
      '30', // Timeout de socket para conexões instáveis
      '--retries',
      '5', // Mais tentativas em caso de falha
      '--fragment-retries',
      '5', // Tentativas para fragmentos
      '--retry-sleep',
      '1', // Tempo entre tentativas
      '--continue', // Continuar downloads interrompidos
      '--no-abort-on-unavailable-fragment', // Não abortar por fragmentos indisponíveis
    ];

    // Para playlists, remover template personalizado e usar abordagem mais simples
    if (isPlaylist) {
      // Não usar template personalizado, vamos capturar o progresso do jeito padrão
      // Marcar o download como playlist para tratamento especial
      download.title = download.title.includes('Playlist')
        ? download.title
        : `${download.title} (Playlist)`;
      // Inicializar variáveis para controle de playlist
      (download as any).playlistCurrent = 0;
      (download as any).playlistTotal = 0;
      (download as any).isPlaylist = true;
    }

    const process = spawn(this.ytDlpPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 0, // Sem timeout para o processo (deixar o yt-dlp gerenciar)
      detached: false,
      windowsHide: true, // Esconder janela do processo no Windows
    });

    this.processes.set(id, process);

    process.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();

      this.parseProgress(id, output);

      // Notificar o frontend sobre o progresso
      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-progress', {
          ...this.downloads.get(id),
        });
      }
    });

    process.stderr?.on('data', (data: Buffer) => {
      console.error('yt-dlp error:', data.toString());
    });

    process.on('close', (code: number | null) => {
      this.processes.delete(id);

      if (code === 0) {
        download.status = 'completed';
        download.progress = 100;

        // Manter o download na lista após completar
        this.downloads.set(id, download);

        if (this.mainWindow) {
          // Simular um pequeno delay para melhor UX
          setTimeout(() => {
            if (this.mainWindow) {
              this.mainWindow.webContents.send('download-complete', {
                ...download,
                outputFile: 'Download concluído com sucesso',
              });
            }
          }, 1500);
        }
      } else {
        download.status = 'error';
        download.error = `Download failed with code ${code}`;
        this.downloads.set(id, download);

        if (this.mainWindow) {
          this.mainWindow.webContents.send('download-error', {
            ...download,
          });
        }
      }
    });

    process.on('error', (error: Error) => {
      this.processes.delete(id);
      download.status = 'error';
      download.error = error.message;
      this.downloads.set(id, download);

      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-error', {
          ...download,
        });
      }
    });
  }

  private parseProgress(id: string, output: string): void {
    const download = this.downloads.get(id);
    if (!download) return;

    const lines = output.split('\n');
    const isPlaylist = (download as any).isPlaylist || false;

    lines.forEach((line) => {
      // Capturar informações de playlist (quando inicia um novo item)
      if (line.includes('[download] Downloading item') || line.includes('Downloading video')) {
        const itemMatch = line.match(/(\d+) of (\d+)/);
        if (itemMatch) {
          const [, current, total] = itemMatch;
          (download as any).playlistCurrent = parseInt(current);
          (download as any).playlistTotal = parseInt(total);
        }
      }

      // Capturar título da música de forma mais específica
      if (line.includes('[download] Destination:') || line.includes('Destination:')) {
        const destinationMatch = line.match(/Destination:\s*(.+)/);
        if (destinationMatch && isPlaylist) {
          const fullPath = destinationMatch[1].trim();
          // Extrair apenas o nome do arquivo sem extensão
          const fileName =
            fullPath
              .split(/[\\/]/)
              .pop()
              ?.replace(/\.[^.]+$/, '') || '';
          const current = (download as any).playlistCurrent || 1;
          const total = (download as any).playlistTotal || 1;

          if (fileName && total > 1 && !fileName.includes('format(s)')) {
            download.title = `${fileName} (${current}/${total})`;
          }
        }
      }

      // Fallback: capturar título de outras formas, mas filtrar informações técnicas
      if (line.includes('[info]') && line.includes('title:')) {
        const titleMatch = line.match(/title:\s*(.+)/);
        if (titleMatch && isPlaylist) {
          const itemTitle = titleMatch[1].trim();
          const current = (download as any).playlistCurrent || 1;
          const total = (download as any).playlistTotal || 1;
          // Filtrar informações técnicas
          if (
            total > 1 &&
            itemTitle &&
            !itemTitle.includes('format(s)') &&
            !itemTitle.includes('(')
          ) {
            download.title = `${itemTitle} (${current}/${total})`;
          }
        }
      }

      // Capturar progresso
      if (line.includes('[download]') && line.includes('%')) {
        const progressMatch = line.match(/(\d+\.?\d*)%/);
        if (progressMatch) {
          const itemProgress = parseFloat(progressMatch[1]);

          if (isPlaylist) {
            const current = (download as any).playlistCurrent || 1;
            const total = (download as any).playlistTotal || 1;

            if (total > 1) {
              // Calcular progresso total da playlist
              const completedItems = Math.max(0, current - 1);
              const progressPerItem = 100 / total;
              const currentItemProgress = (itemProgress / 100) * progressPerItem;
              const totalProgress = completedItems * progressPerItem + currentItemProgress;

              download.progress = Math.min(totalProgress, 99.9);
            } else {
              download.progress = itemProgress;
            }
          } else {
            // Para vídeos individuais
            if (itemProgress === 100) {
              download.progress = 99.8;
              setTimeout(() => {
                download.progress = 100;
                download.status = 'completed';
                this.downloads.set(id, download);
                if (this.mainWindow) {
                  this.mainWindow.webContents.send('download-progress', {
                    ...download,
                  });
                  setTimeout(() => {
                    if (this.mainWindow) {
                      this.mainWindow.webContents.send('download-complete', {
                        ...download,
                      });
                    }
                  }, 1000);
                }
              }, 2000);
            } else {
              download.progress = itemProgress;
            }
          }
        }

        // Capturar velocidade e ETA de forma mais robusta
        const speedMatch = line.match(/at\s+([^\s]+\/s)/);
        if (speedMatch) {
          download.speed = speedMatch[1];
        }

        // Melhorar captura do ETA
        const etaMatch =
          line.match(/ETA\s+([^\s]+)/) ||
          line.match(/eta\s+([^\s]+)/i) ||
          line.match(/in\s+([^\s]+)/);
        if (etaMatch && etaMatch[1] !== 'Unknown') {
          download.eta = etaMatch[1];
        }
      }

      if (line.includes('[info]') && line.includes('title')) {
        const titleMatch = line.match(/title:\s+(.+)/);
        if (titleMatch) {
          download.title = titleMatch[1];
        }
      }

      // Detectar quando um item da playlist foi completado ou falhou
      if (
        isPlaylist &&
        (line.includes('[download] 100%') ||
          line.includes('ERROR:') ||
          line.includes('WARNING:') ||
          line.includes('Skipping') ||
          line.includes('unavailable') ||
          line.includes('Private video') ||
          line.includes('Video unavailable'))
      ) {
        const current = (download as any).playlistCurrent || 1;
        const total = (download as any).playlistTotal || 1;

        if (current <= total) {
          // Calcular progresso baseado em itens processados (incluindo os que falharam)
          const completedProgress = (current / total) * 100;
          download.progress = Math.min(completedProgress, 99.9);
        }
      }

      // Detectar quando uma playlist termina completamente
      if (isPlaylist) {
        // Várias condições para detectar fim da playlist
        if (
          line.includes('Finished downloading playlist') ||
          (line.includes('Downloaded') && line.includes('videos')) ||
          line.includes('All videos downloaded successfully') ||
          // Detectar fim mesmo com erros
          (line.includes('playlist') && line.includes('complete')) ||
          // Se chegou ao último item (mesmo com falhas)
          ((download as any).playlistCurrent >= (download as any).playlistTotal &&
            (download as any).playlistTotal > 0)
        ) {
          download.progress = 100;
          download.status = 'completed';
          download.title = download.title.replace(/\s*\(\d+\/\d+\)/, '') + ' (Completo)';
          this.downloads.set(id, download);

          if (this.mainWindow) {
            this.mainWindow.webContents.send('download-complete', {
              ...download,
            });
          }
        }
      }
    });

    this.downloads.set(id, download);
  }

  private getFormatString(quality: string, format: string): string {
    switch (quality) {
      case 'best':
        return format === 'mp3' ? 'bestaudio/best' : 'best';
      case 'worst':
        return format === 'mp3' ? 'worstaudio/worst' : 'worst';
      default:
        return `best[height<=${quality}]`;
    }
  }

  cancelDownload(id: string): boolean {
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

  getDownloads(): Download[] {
    return Array.from(this.downloads.values());
  }

  removeDownload(id: string): boolean {
    this.cancelDownload(id);
    return this.downloads.delete(id);
  }
  async getVideoInfo(url: string): Promise<VideoInfo> {
    if (!this.ytDlpPath) {
      throw new Error('yt-dlp não encontrado');
    }

    // Detectar se é uma playlist
    const isPlaylist = url.includes('playlist?list=') || url.includes('&list=');

    return new Promise((resolve, reject) => {
      let args: string[];

      if (isPlaylist) {
        // Para playlists, usar --flat-playlist para obter informações básicas rapidamente
        args = [
          url,
          '--flat-playlist',
          '--dump-json',
          '--no-warnings',
          '--skip-download',
          '--playlist-end',
          '1', // Apenas o primeiro item para obter info da playlist
        ];
      } else {
        // Para vídeos individuais, usar método normal
        args = [url, '--dump-json', '--no-warnings', '--skip-download'];
      }

      const process = spawn(this.ytDlpPath as string, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      process.on('close', (code: number | null) => {
        if (code === 0 && output.trim()) {
          try {
            if (isPlaylist) {
              // Para playlists, primeiro item ou informação da playlist
              const lines = output.trim().split('\n');
              let playlistInfo: any = {};

              for (const line of lines) {
                try {
                  const info = JSON.parse(line);
                  if (info.playlist_title || info.title) {
                    playlistInfo = info;
                    break;
                  }
                } catch {}
              }

              if (playlistInfo.playlist_title || playlistInfo.title) {
                resolve({
                  title: playlistInfo.playlist_title || playlistInfo.title || 'Playlist do YouTube',
                  uploader:
                    playlistInfo.playlist_uploader || playlistInfo.uploader || playlistInfo.channel,
                  duration: playlistInfo.playlist_count
                    ? `${playlistInfo.playlist_count} itens`
                    : 'Playlist',
                  thumbnail: playlistInfo.thumbnail,
                });
              } else {
                // Fallback: tentar obter info básica da playlist
                this.getPlaylistBasicInfo(url)
                  .then(resolve)
                  .catch(() => {
                    resolve({
                      title: 'Playlist do YouTube',
                      uploader: 'YouTube',
                      duration: 'Playlist',
                      thumbnail: undefined,
                    });
                  });
              }
            } else {
              // Para vídeos individuais
              const info = JSON.parse(output.trim());
              resolve({
                title: info.title || 'Título não disponível',
                uploader: info.uploader || info.channel,
                duration: this.formatDuration(info.duration),
                thumbnail: info.thumbnail,
              });
            }
          } catch {
            reject(new Error('Erro ao processar informações do vídeo/playlist'));
          }
        } else {
          reject(new Error(`Erro ao obter informações: ${errorOutput}`));
        }
      });

      process.on('error', (error: Error) => {
        reject(error);
      });

      // Timeout reduzido para playlists (20s) e normal para vídeos (30s)
      const timeout = isPlaylist ? 20000 : 30000;
      setTimeout(() => {
        process.kill();
        reject(new Error(`Timeout ao obter informações (${timeout / 1000}s)`));
      }, timeout);
    });
  }

  // Método auxiliar para obter informações básicas de playlist mais rapidamente
  private async getPlaylistBasicInfo(url: string): Promise<VideoInfo> {
    if (!this.ytDlpPath) {
      throw new Error('yt-dlp não encontrado');
    }

    return new Promise((resolve, reject) => {
      const args = [url, '--get-title', '--get-duration', '--playlist-end', '1', '--no-warnings'];

      const process = spawn(this.ytDlpPath as string, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';

      process.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.on('close', (code: number | null) => {
        if (code === 0 && output.trim()) {
          const lines = output.trim().split('\n');
          resolve({
            title: lines[0] || 'Playlist do YouTube',
            uploader: 'YouTube',
            duration: 'Playlist',
            thumbnail: undefined,
          });
        } else {
          reject(new Error('Erro ao obter informações básicas da playlist'));
        }
      });

      setTimeout(() => {
        process.kill();
        reject(new Error('Timeout ao obter informações básicas'));
      }, 10000); // Timeout ainda menor para método básico
    });
  }

  // Método para obter contagem rápida de itens de playlist
  async getPlaylistCount(url: string): Promise<number> {
    if (!this.ytDlpPath) {
      throw new Error('yt-dlp não encontrado');
    }

    return new Promise((resolve) => {
      const args = [url, '--flat-playlist', '--dump-json', '--no-warnings', '--skip-download'];

      const process = spawn(this.ytDlpPath as string, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';

      process.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.on('close', (code: number | null) => {
        if (code === 0 && output.trim()) {
          try {
            const lines = output.trim().split('\n');
            let count = 0;

            for (const line of lines) {
              try {
                JSON.parse(line);
                count++;
              } catch {}
            }

            resolve(count);
          } catch {
            resolve(0);
          }
        } else {
          resolve(0);
        }
      });

      process.on('error', () => {
        resolve(0);
      });

      // Timeout para contagem rápida
      setTimeout(() => {
        process.kill();
        resolve(0);
      }, 15000);
    });
  }

  private formatDuration(seconds: number): string {
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

  pauseDownload(id: string): boolean {
    // Implementação para pausar download se necessário
    return this.cancelDownload(id);
  }

  resumeDownload(id: string): boolean {
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

export default DownloadManager;
