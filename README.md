# 🎵 YouTube to MP3 Converter

Um conversor moderno e elegante de vídeos do YouTube para MP3, construído com **Electron**, **React**, **TypeScript** e **shadcn/ui**.

## 📦 Download

Baixe a versão mais recente do aplicativo para Windows:

- 🪟 [Download para Windows (Portable .exe)](https://github.com/micaelgomestavares/ytbdownloader/releases/download/V1.0.0/YTBD-Portable-1.0.0.exe)

> **Não requer instalação.** Basta baixar, abrir o arquivo `.exe` e começar a usar!

## ✨ Características

- 🎨 **Interface Moderna**: Design elegante com shadcn/ui e Tailwind CSS
- 📱 **Responsivo**: Interface adaptável para diferentes tamanhos de tela
- 🎯 **TypeScript**: Código robusto e tipado
- 📊 **Progresso em Tempo Real**: Acompanhe o progresso dos downloads
- 📁 **Gerenciamento de Fila**: Organize seus downloads
- ⚙️ **Configurações Avançadas**: Escolha qualidade e pasta de destino
- 🎵 **Suporte a Playlists**: Baixe playlists inteiras
- 🔄 **Downloads Simultâneos**: Múltiplos downloads ao mesmo tempo

## 🚀 Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **Python** (versão 3.7 ou superior)
- **yt-dlp**: `pip install yt-dlp`
- **ffmpeg**: Para conversão de áudio

### Instalação do yt-dlp

```bash
pip install yt-dlp
```

### Instalação do FFmpeg

**Windows:**
```bash
# Usando Chocolatey
choco install ffmpeg

# Ou baixe diretamente de https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

## 🛠️ Instalação e Desenvolvimento

### 1. Clone o repositório
```bash
git clone https://github.com/your-username/youtube-to-mp3-converter.git
cd youtube-to-mp3-converter
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Execute em modo de desenvolvimento
```bash
npm run dev
```

## 📦 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia o app em modo de desenvolvimento
- `npm run dev:react` - Inicia apenas o servidor React
- `npm run dev:electron` - Inicia apenas o Electron

### Build
- `npm run build` - Builda o projeto completo
- `npm run build:react` - Builda apenas o React
- `npm run build:electron` - Builda o executável do Electron

### Distribuição
- `npm run build:win` - Cria executável portable para Windows

### Outros
- `npm start` - Inicia o app já buildado

## 🎯 Como Usar

1. **Inicie o aplicativo**
2. **Cole uma URL do YouTube** na caixa de entrada
3. **Selecione a qualidade** desejada nas configurações
4. **Escolha a pasta de destino** (opcional)
5. **Clique em "Baixar"** e aguarde a conclusão
6. **Gerencie sua fila** de downloads na interface

### URLs Suportadas
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/playlist?list=PLAYLIST_ID`

## 🔧 Configurações

### Qualidades Disponíveis
- **Melhor qualidade**: Máxima qualidade disponível
- **Menor qualidade**: Download mais rápido, menor tamanho
- **Melhor áudio**: Prioriza a qualidade do áudio

### Personalização
- Pasta de download personalizada
- Limpeza automática de arquivos temporários

## 📋 Recursos Implementados

- ✅ Interface moderna com shadcn/ui
- ✅ Suporte a TypeScript
- ✅ Downloads de vídeos individuais
- ✅ Downloads de playlists
- ✅ Progresso em tempo real
- ✅ Gerenciamento de fila
- ✅ Configurações de qualidade
- ✅ Seleção de pasta personalizada
- ✅ Verificação de dependências
- ✅ Tratamento de erros
- ✅ Limpeza de arquivos temporários
- ✅ Build para múltiplas plataformas

## 🐛 Solução de Problemas

### "yt-dlp não encontrado"
```bash
pip install yt-dlp
# ou
pip3 install yt-dlp
```

### "ffmpeg não encontrado"
Instale o FFmpeg seguindo as instruções na seção de pré-requisitos.

### Erro de permissão no Windows
Execute o terminal como administrador e tente novamente.

### Erro de build
```bash
npm run clean
npm install
npm run build
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Ferramenta de download
- [Electron](https://www.electronjs.org/) - Framework para apps desktop
- [React](https://reactjs.org/) - Biblioteca UI
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Ícones

---

**Feito com ❤️ e TypeScript**
