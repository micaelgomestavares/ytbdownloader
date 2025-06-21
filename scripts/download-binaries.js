const https = require('https');
const fs = require('fs');
const path = require('path');

// URLs dos binários
const binaries = {
  'yt-dlp.exe': 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  'ffmpeg.exe': 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'
};

const binariesDir = path.join(__dirname, '..', 'binaries');

if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Baixando ${filename}...`);
    
    const file = fs.createWriteStream(path.join(binariesDir, filename));
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Redirect
        return downloadFile(response.headers.location, filename)
          .then(resolve)
          .catch(reject);
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r   Progresso: ${progress}%`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`\n✅ ${filename} baixado com sucesso!`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(path.join(binariesDir, filename), () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function downloadBinaries() {
  console.log('🚀 Baixando binários necessários...\n');
  
  try {
    // Baixar yt-dlp
    await downloadFile(binaries['yt-dlp.exe'], 'yt-dlp.exe');
    
    console.log('\n✅ Todos os binários foram baixados com sucesso!');
    console.log(`📁 Localização: ${binariesDir}`);
    
  } catch (error) {
    console.error('\n❌ Erro ao baixar binários:', error.message);
    process.exit(1);
  }
}

// Se executado diretamente
if (require.main === module) {
  downloadBinaries();
}

module.exports = { downloadBinaries };
