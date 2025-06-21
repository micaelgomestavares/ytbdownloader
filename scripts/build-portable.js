#!/usr/bin/env node

/**
 * Script para criar versão PORTABLE
 * Gera um executável único sem instalador
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logPrefix(prefix, message, color = 'reset') {
  console.log(`${colors.bright}[${prefix}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

// Executar comando
function spawnProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    logPrefix(options.prefix || 'CMD', `${command} ${args.join(' ')}`, 'blue');
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Limpeza automática
async function cleanup() {
  logPrefix('CLEANUP', 'Fazendo limpeza automática...', 'yellow');
  
  try {
    // Fechar processos
    await spawnProcess('taskkill', ['/f', '/im', 'YouTube*to*MP3*Converter.exe'], { prefix: 'KILL' }).catch(() => {});
    await spawnProcess('taskkill', ['/f', '/im', 'youtube-to-mp3-converter.exe'], { prefix: 'KILL' }).catch(() => {});
    await spawnProcess('taskkill', ['/f', '/im', 'electron.exe'], { prefix: 'KILL' }).catch(() => {});
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remover dist se existir
    if (fs.existsSync('dist')) {
      logPrefix('CLEANUP', 'Removendo dist anterior...', 'yellow');
      if (process.platform === 'win32') {
        await spawnProcess('rmdir', ['/s', '/q', 'dist'], { prefix: 'CLEAN' }).catch(() => {});
      } else {
        await spawnProcess('rm', ['-rf', 'dist'], { prefix: 'CLEAN' }).catch(() => {});
      }
    }
    
    logPrefix('CLEANUP', 'Limpeza concluída!', 'green');
  } catch (error) {
    logPrefix('CLEANUP', 'Limpeza parcial (continuando...)', 'yellow');
  }
}

async function main() {
  log('📦 YouTube Downloader - Build PORTABLE', 'cyan');
  log('=====================================', 'cyan');
  log('🚀 Criando versão executável sem instalador!', 'magenta');
  log('', 'reset');
  
  try {
    // 1. Limpeza automática
    await cleanup();
    
    // 2. Verificar se existe build do React
    if (!fs.existsSync('build')) {
      logPrefix('REACT', 'Build do React não encontrado, criando...', 'yellow');
      await spawnProcess('npm', ['run', 'build:react'], { prefix: 'WEBPACK' });
    } else {
      logPrefix('REACT', 'Build do React já existe, reutilizando...', 'green');
    }
    
    // 3. Verificar se existem binários
    if (!fs.existsSync('binaries') || fs.readdirSync('binaries').length === 0) {
      logPrefix('BINARIES', 'Baixando binários necessários...', 'cyan');
      await spawnProcess('npm', ['run', 'download-binaries'], { prefix: 'DOWNLOAD' });
    } else {
      logPrefix('BINARIES', 'Binários já existem, reutilizando...', 'green');
    }
      // 4. Build PORTABLE do Electron-Builder
    logPrefix('PORTABLE', 'Criando versão portable...', 'magenta');
    await spawnProcess('npx', ['electron-builder', '--win', 'portable', '--publish', 'never'], { prefix: 'ELECTRON-BUILDER' });
    
    // 5. Verificar resultado
    if (fs.existsSync('dist')) {
      const distFiles = fs.readdirSync('dist');
      const portableFiles = distFiles.filter(f => 
        f.includes('Portable') && f.endsWith('.exe')
      );
      
      log('', 'reset');
      log('✅ VERSÃO PORTABLE CRIADA COM SUCESSO!', 'green');
      log('====================================', 'green');
      log('🎉 Arquivo executável único - sem instalação!', 'cyan');
      log('', 'reset');
      
      portableFiles.forEach(portable => {
        const size = fs.statSync(path.join('dist', portable)).size;
        const sizeMB = (size / 1024 / 1024).toFixed(1);
        logPrefix('PORTABLE', `📦 ${portable} (${sizeMB} MB)`, 'cyan');
      });
      
      if (portableFiles.length === 0) {
        // Procurar por outros executáveis
        const exeFiles = distFiles.filter(f => f.endsWith('.exe') && !f.includes('Setup'));
        exeFiles.forEach(exe => {
          const size = fs.statSync(path.join('dist', exe)).size;
          const sizeMB = (size / 1024 / 1024).toFixed(1);
          logPrefix('EXECUTÁVEL', `📦 ${exe} (${sizeMB} MB)`, 'cyan');
        });
      }
      
      logPrefix('PASTA', path.resolve('dist'), 'blue');
      log('', 'reset');
      log('💡 Basta rodar o executável - não precisa instalar!', 'yellow');
    }
    
  } catch (error) {
    logPrefix('ERROR', `Falha: ${error.message}`, 'red');
    process.exit(1);
  }
}

main().catch(console.error);
