const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

const binaries = {
  ytDlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  ffmpegZip:
    'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
};

const binariesDir = path.join(__dirname, '..', 'binaries');

if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const targetPath = path.join(binariesDir, filename);
    console.log(`Baixando ${filename}...`);

    const request = https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        response.resume();
        downloadFile(response.headers.location, filename).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Falha ao baixar ${filename}: HTTP ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(targetPath);
      const totalSize = Number(response.headers['content-length']) || 0;
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;

        if (totalSize > 0) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r   Progresso: ${progress}%`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`\n${filename} baixado com sucesso.`);
        resolve();
      });

      file.on('error', (err) => {
        fs.rm(targetPath, { force: true }, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
  });
}

function extractFfmpeg(zipPath) {
  const extractDir = path.join(binariesDir, 'ffmpeg-extract');

  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });

  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: 'inherit' },
  );

  const ffmpegPath = findFile(extractDir, 'ffmpeg.exe');
  if (!ffmpegPath) {
    throw new Error('ffmpeg.exe nao encontrado no arquivo baixado');
  }

  fs.copyFileSync(ffmpegPath, path.join(binariesDir, 'ffmpeg.exe'));
  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.rmSync(zipPath, { force: true });
  console.log('ffmpeg.exe extraido com sucesso.');
}

function findFile(dir, fileName) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
      return fullPath;
    }

    if (entry.isDirectory()) {
      const nestedResult = findFile(fullPath, fileName);
      if (nestedResult) {
        return nestedResult;
      }
    }
  }

  return null;
}

async function downloadBinaries() {
  console.log('Baixando binarios necessarios...\n');

  try {
    await downloadFile(binaries.ytDlp, 'yt-dlp.exe');

    const ffmpegZipName = 'ffmpeg.zip';
    await downloadFile(binaries.ffmpegZip, ffmpegZipName);
    extractFfmpeg(path.join(binariesDir, ffmpegZipName));

    console.log('\nTodos os binarios foram baixados com sucesso.');
    console.log(`Localizacao: ${binariesDir}`);
  } catch (error) {
    console.error('\nErro ao baixar binarios:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  downloadBinaries();
}

module.exports = { downloadBinaries };
