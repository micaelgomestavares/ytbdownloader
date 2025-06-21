#!/usr/bin/env node

/**
 * Script de limpeza - Remove builds antigos e processos em execução
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para executar comando
function runCommand(command, args = []) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      shell: true, 
      stdio: 'pipe'
    });
    
    child.on('close', () => resolve());
    child.on('error', () => resolve()); // Ignorar erros
  });
}

// Função para remover diretório recursivamente
async function removeDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      log(`🗑️  Removendo ${dirPath}...`, 'yellow');
      
      if (process.platform === 'win32') {
        await runCommand('rmdir', ['/s', '/q', dirPath]);
      } else {
        await runCommand('rm', ['-rf', dirPath]);
      }
      
      // Verificar se foi removido
      if (!fs.existsSync(dirPath)) {
        log(`✅ ${dirPath} removido`, 'green');
      }
    }
  } catch (error) {
    log(`⚠️  Não foi possível remover ${dirPath}`, 'yellow');
  }
}

async function main() {
  log('🧹 Limpando projeto...', 'cyan');
  
  // 1. Fechar processos do Electron
  log('🔴 Fechando processos do Electron...', 'yellow');
  await runCommand('taskkill', ['/f', '/im', 'YouTube Downloader.exe']);
  await runCommand('taskkill', ['/f', '/im', 'electron.exe']);
  
  // 2. Remover pastas de build
  await removeDir('dist');
  await removeDir('build');
  
  // 3. Remover cache do electron-builder
  const electronBuilderCache = path.join(require('os').homedir(), 'AppData', 'Local', 'electron-builder', 'Cache');
  if (fs.existsSync(electronBuilderCache)) {
    log('🗑️  Limpando cache do electron-builder...', 'yellow');
    await removeDir(electronBuilderCache);
  }
  
  log('✅ Limpeza concluída!', 'green');
}

main().catch(console.error);
