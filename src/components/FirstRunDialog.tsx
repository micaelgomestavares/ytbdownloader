import React, { useState } from 'react';
import { FolderOpen, Download } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  Button,
  Input
} from './ui';

interface FirstRunDialogProps {
  open: boolean;
  onComplete: (downloadPath: string) => void;
}

const FirstRunDialog: React.FC<FirstRunDialogProps> = ({ open, onComplete }) => {
  const [selectedPath, setSelectedPath] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    try {
      const path = await window.electronAPI.selectFolder('Selecionar Pasta de Downloads');
      if (path) {
        setSelectedPath(path);
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleContinue = () => {
    if (selectedPath) {
      onComplete(selectedPath);
    }
  };

  const handleUseDefault = async () => {
    try {
      const defaultPath = await window.electronAPI.getDownloadsPath();
      onComplete(defaultPath);
    } catch (error) {
      console.error('Erro ao obter pasta padrão:', error);
      // Fallback para pasta comum
      onComplete('C:\\Users\\' + (process.env.USERNAME || 'Usuario') + '\\Downloads');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Bem-vindo ao YouTube to MP3 Converter!
          </DialogTitle>
          <DialogDescription>
            Para começar, escolha onde você deseja salvar seus arquivos MP3 baixados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pasta de Downloads:</label>
            <div className="flex gap-2">
              <Input
                value={selectedPath || 'Nenhuma pasta selecionada'}
                placeholder="Selecione uma pasta..."
                readOnly
                className="flex-1"
              />
              <Button 
                onClick={handleSelectFolder}
                disabled={isSelecting}
                variant="outline"
                size="sm"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {isSelecting ? 'Selecionando...' : 'Procurar'}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">💡 Dica:</p>
            <p>Você pode alterar esta configuração a qualquer momento nas configurações do aplicativo.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleUseDefault}
          >
            Usar Pasta Padrão
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedPath}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FirstRunDialog;
