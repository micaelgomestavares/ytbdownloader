import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Settings as SettingsIcon, 
  ChevronDown, 
  ChevronUp,
  Target,
  Folder,
  Search,
  Trash2,
  HardDrive
} from 'lucide-react';

interface Settings {
  quality: string;
  outputFolder?: string;
}

interface SettingsProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQualityChange = (quality: string) => {
    onUpdateSettings({ quality });
  };

  const handleSelectOutputFolder = async () => {
    try {
      const folder = await (window as any).electronAPI.selectOutputFolder();
      if (folder) {
        onUpdateSettings({ outputFolder: folder });
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
    }
  };

  const handleCleanupTempFiles = async () => {
    try {
      await (window as any).electronAPI.cleanupTempFiles();
    } catch (error) {
      console.error('Erro ao limpar arquivos temporários:', error);
    }
  };

  const qualityOptions = [
    { 
      value: 'best', 
      label: 'Melhor qualidade', 
      description: 'Máxima qualidade disponível',
      badge: 'Recomendado'
    },
    { 
      value: 'worst', 
      label: 'Menor qualidade', 
      description: 'Download mais rápido, menor tamanho',
      badge: 'Rápido'
    },
    { 
      value: 'bestaudio/best', 
      label: 'Melhor áudio', 
      description: 'Prioriza qualidade do áudio',
      badge: 'Áudio'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between p-0 h-auto font-normal"
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <SettingsIcon className="h-4 w-4" />
            Configurações
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Quality Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <h3 className="font-medium text-sm">Qualidade do Download</h3>
            </div>
            
            <div className="space-y-2">
              {qualityOptions.map(option => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    value={option.value}
                    checked={settings.quality === option.value}
                    onChange={() => handleQualityChange(option.value)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{option.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {option.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Output Folder Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <h3 className="font-medium text-sm">Pasta de Downloads</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs break-all">
                    {settings.outputFolder || './downloads (pasta padrão)'}
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectOutputFolder}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Selecionar Pasta
              </Button>
            </div>
          </div>

          <Separator />

          {/* Cleanup Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <h3 className="font-medium text-sm">Limpeza</h3>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanupTempFiles}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Arquivos Temporários
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Remove arquivos temporários criados durante o processo de download
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default Settings;
