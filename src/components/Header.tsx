import {
  ChevronDown,
  FileAudio,
  FileVideo,
  Folder,
  FolderOpen,
  KeyRound,
  Settings,
  Volume2,
} from 'lucide-react';
import type React from 'react';
import logoImage from '../../public/logo.png';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  onOpenDownloads: () => void;
  onSelectFolder: () => void;
  onSelectCookiesFile: () => void;
  settings: {
    quality: string;
    format: string;
    cookiesBrowser: string;
    cookiesFile: string;
    outputFolder: string;
  };
  onSettingsChange: (settings: {
    quality: string;
    format: string;
    cookiesBrowser: string;
    cookiesFile: string;
    outputFolder: string;
  }) => void;
}

const Header: React.FC<HeaderProps> = ({
  onOpenDownloads,
  onSelectFolder,
  onSelectCookiesFile,
  settings,
  onSettingsChange,
}) => {
  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'best':
        return 'Melhor';
      case '320':
        return '320 kbps';
      case '256':
        return '256 kbps';
      case '192':
        return '192 kbps';
      case '128':
        return '128 kbps';
      case 'worst':
        return 'Pior';
      default:
        return quality;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'mp3':
        return 'MP3';
      case 'm4a':
        return 'M4A';
      case 'wav':
        return 'WAV';
      case 'mp4':
        return 'MP4';
      case 'webm':
        return 'WEBM';
      default:
        return format.toUpperCase();
    }
  };

  const getCookiesBrowserLabel = (browser: string) => {
    switch (browser) {
      case 'chrome':
        return 'Chrome';
      case 'edge':
        return 'Edge';
      case 'firefox':
        return 'Firefox';
      case 'brave':
        return 'Brave';
      case 'file':
        return 'cookies.txt';
      default:
        return 'Desativado';
    }
  };

  return (
    <header className="sticky top-0 z-50 p-4">
      <div className="mx-auto container rounded-full border border-solid border-slate-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoImage} alt="YouTube to MP3" className="size-12 object-contain" />
          </div>

          <div className="flex items-center space-x-3">
            {/* Botão Abrir Pasta de Downloads */}
            <Button variant="outline" size="sm" onClick={onOpenDownloads} className="gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Pasta de Downloads</span>
            </Button>

            {/* Menu de configurações principal */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Submenu de Qualidade com RadioGroup */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center">
                    <Volume2 className="mr-2 h-4 w-4" />
                    <span>Qualidade do Áudio</span>
                    <Badge variant="secondary" className="ml-auto">
                      {getQualityLabel(settings.quality)}
                    </Badge>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={settings.quality}
                      onValueChange={(value) => onSettingsChange({ ...settings, quality: value })}
                    >
                      <DropdownMenuRadioItem value="best">
                        Melhor (Máxima Qualidade)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="320">
                        320 kbps (Excelente)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="256">
                        256 kbps (Muito Boa)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="192">192 kbps (Boa)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="128">128 kbps (Padrão)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="worst">
                        Pior (Tamanho Mínimo)
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center">
                    <FileAudio className="mr-2 h-4 w-4" />
                    <span>Formato</span>
                    <Badge variant="secondary" className="ml-auto">
                      {getFormatLabel(settings.format)}
                    </Badge>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={settings.format}
                      onValueChange={(value) => onSettingsChange({ ...settings, format: value })}
                    >
                      <DropdownMenuRadioItem value="mp3">
                        <FileAudio className="mr-2 h-4 w-4" />
                        MP3 (Audio)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="m4a">
                        <FileAudio className="mr-2 h-4 w-4" />
                        M4A (Audio)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="wav">
                        <FileAudio className="mr-2 h-4 w-4" />
                        WAV (Audio)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="mp4">
                        <FileVideo className="mr-2 h-4 w-4" />
                        MP4 (Video)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="webm">
                        <FileVideo className="mr-2 h-4 w-4" />
                        WEBM (Video)
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center">
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Login YouTube</span>
                    <Badge variant="secondary" className="ml-auto">
                      {getCookiesBrowserLabel(settings.cookiesBrowser)}
                    </Badge>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={settings.cookiesBrowser}
                      onValueChange={(value) =>
                        onSettingsChange({ ...settings, cookiesBrowser: value })
                      }
                    >
                      <DropdownMenuRadioItem value="none">Desativado</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="chrome">Chrome</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="edge">Edge</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="firefox">Firefox</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="brave">Brave</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="file">
                        Arquivo cookies.txt
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSelectCookiesFile} className="flex items-center">
                      <Folder className="mr-2 h-4 w-4" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span>Selecionar cookies.txt</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {settings.cookiesFile || 'Nenhum arquivo selecionado'}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Pasta de Downloads</DropdownMenuLabel>
                {/* Opções de pasta */}
                <DropdownMenuItem onClick={onSelectFolder} className="flex items-center">
                  <Folder className="mr-2 h-4 w-4" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span>Alterar Pasta</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {settings.outputFolder || 'Nenhuma pasta selecionada'}
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
