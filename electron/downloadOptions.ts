import path from 'node:path';

interface BuildYtDlpArgsOptions {
  url: string;
  outputPath: string;
  quality: string;
  format: string;
  ffmpegPath?: string | null;
  cookiesBrowser?: string;
  cookiesFile?: string;
}

const audioFormats = new Set(['mp3', 'm4a', 'wav']);
const videoFormats = new Set(['mp4', 'webm', 'mkv']);

export function buildYtDlpArgs(options: BuildYtDlpArgsOptions): string[] {
  const normalizedFormat = normalizeFormat(options.format);
  const args = [
    options.url,
    '--format',
    getFormatString(options.quality, normalizedFormat),
    '--output',
    path.join(options.outputPath, '%(title)s.%(ext)s'),
    '--progress',
    '--newline',
    '--no-warnings',
    '--socket-timeout',
    '30',
    '--retries',
    '5',
    '--fragment-retries',
    '5',
    '--retry-sleep',
    '1',
    '--continue',
    '--no-abort-on-unavailable-fragment',
  ];

  if (audioFormats.has(normalizedFormat)) {
    args.push('--extract-audio', '--audio-format', normalizedFormat);

    if (options.quality !== 'best' && options.quality !== 'worst') {
      args.push('--audio-quality', options.quality);
    }
  }

  if (videoFormats.has(normalizedFormat)) {
    args.push('--merge-output-format', normalizedFormat);
  }

  if (options.ffmpegPath && options.ffmpegPath !== 'ffmpeg') {
    args.push('--ffmpeg-location', path.dirname(options.ffmpegPath));
  }

  if (options.cookiesFile) {
    args.push('--cookies', options.cookiesFile);
  } else if (isSupportedCookiesBrowser(options.cookiesBrowser)) {
    args.push('--cookies-from-browser', options.cookiesBrowser);
  }

  return args;
}

export function isSupportedCookiesBrowser(browser?: string): browser is string {
  return ['chrome', 'edge', 'firefox', 'brave', 'opera', 'vivaldi'].includes(browser || '');
}

function normalizeFormat(format: string): string {
  const normalized = format.toLowerCase();

  if (audioFormats.has(normalized) || videoFormats.has(normalized)) {
    return normalized;
  }

  return 'mp3';
}

function getFormatString(quality: string, format: string): string {
  if (audioFormats.has(format)) {
    return quality === 'worst' ? 'worstaudio*/worstaudio/worst' : 'bestaudio*/bestaudio/best';
  }

  if (quality === 'worst') {
    return 'worstvideo*+worstaudio/worst';
  }

  switch (format) {
    case 'mp4':
      return 'bestvideo*[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/bestvideo*+bestaudio/best';
    case 'webm':
      return 'bestvideo*[ext=webm]+bestaudio[ext=webm]/best[ext=webm]/bestvideo*+bestaudio/best';
    default:
      return 'bestvideo*+bestaudio/best';
  }
}
