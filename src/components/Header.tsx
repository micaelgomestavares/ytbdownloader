import {
  ChevronDown,
  Folder,
  FolderOpen,
  Moon,
  Settings,
  Sun,
  Volume2,
} from "lucide-react";
import type React from "react";
import logoImage from "../../public/logo.png";
import { useTheme } from "../contexts/ThemeContext";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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
} from "./ui/dropdown-menu";
import { Switch } from "./ui/switch";

interface HeaderProps {
  onOpenDownloads: () => void;
  onSelectFolder: () => void;
  settings: {
    quality: string;
    outputFolder: string;
  };
  onSettingsChange: (settings: {
    quality: string;
    outputFolder: string;
  }) => void;
}

const Header: React.FC<HeaderProps> = ({
  onOpenDownloads,
  onSelectFolder,
  settings,
  onSettingsChange,
}) => {
  const { theme, setTheme } = useTheme();

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case "best":
        return "Melhor";
      case "320":
        return "320 kbps";
      case "256":
        return "256 kbps";
      case "192":
        return "192 kbps";
      case "128":
        return "128 kbps";
      case "worst":
        return "Pior";
      default:
        return quality;
    }
  };
  return (
    <header className="sticky top-0 z-50 p-4">
      <div className="mx-auto container rounded-full border border-solid border-slate-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={logoImage}
              alt="YouTube to MP3"
              className="size-12 object-contain"
            />
          </div>

          <div className="flex items-center space-x-3">
            {/* Botão Abrir Pasta de Downloads */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDownloads}
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Downloads</span>
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
                      onValueChange={(value) =>
                        onSettingsChange({ ...settings, quality: value })
                      }
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
                      <DropdownMenuRadioItem value="192">
                        192 kbps (Boa)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="128">
                        128 kbps (Padrão)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="worst">
                        Pior (Tamanho Mínimo)
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />

                <DropdownMenuLabel>Tema</DropdownMenuLabel>
                <DropdownMenuItem
                  className="flex items-center justify-between"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center">
                    {theme === "dark" ? (
                      <Moon className="mr-2 h-4 w-4" />
                    ) : (
                      <Sun className="mr-2 h-4 w-4" />
                    )}
                    <span>{theme === "dark" ? "Escuro" : "Claro"}</span>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                  />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Pasta de Downloads</DropdownMenuLabel>
                {/* Opções de pasta */}
                <DropdownMenuItem
                  onClick={onSelectFolder}
                  className="flex items-center"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span>Alterar Pasta</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {settings.outputFolder || "Nenhuma pasta selecionada"}
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
