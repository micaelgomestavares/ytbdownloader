import { AlertCircle, CheckCircle, Clock, Download, Inbox, Loader2 } from 'lucide-react';
import type React from 'react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface Dependencies {
  checked: boolean;
  available: boolean;
  message: string;
}

interface StatusBarProps {
  dependencies: Dependencies;
  downloadsCount: number;
  activeDownloads: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ dependencies, downloadsCount, activeDownloads }) => {
  const getDependencyStatus = () => {
    if (!dependencies.checked) {
      return {
        icon: Clock,
        text: 'Verificando dependências...',
        variant: 'secondary' as const,
        className: 'text-yellow-600',
      };
    }

    if (dependencies.available) {
      return {
        icon: CheckCircle,
        text: dependencies.message,
        variant: 'secondary' as const,
        className: 'text-green-600',
      };
    }

    return {
      icon: AlertCircle,
      text: dependencies.message,
      variant: 'destructive' as const,
      className: 'text-red-600',
    };
  };

  const depStatus = getDependencyStatus();
  const DepIcon = depStatus.icon;

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between text-sm">
        {/* Left: Dependency Status */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 ${depStatus.className}`}>
            <DepIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{depStatus.text}</span>
          </div>
        </div>

        {/* Center: Download Activity */}
        <div className="flex items-center space-x-4">
          {activeDownloads > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium">
                  {activeDownloads} download{activeDownloads !== 1 ? 's' : ''} ativo
                  {activeDownloads !== 1 ? 's' : ''}
                </span>
                <Badge variant="default" className="text-xs animate-pulse">
                  Em andamento
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-4" />
            </>
          )}
        </div>

        {/* Right: Queue Info */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Inbox className="h-4 w-4" />
            <span className="text-xs">
              {downloadsCount} item{downloadsCount !== 1 ? 's' : ''} na fila
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
