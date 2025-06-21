import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import DownloadItem from './DownloadItem';
import { 
  Inbox, 
  Trash2, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Hourglass,
  FolderOpen
} from 'lucide-react';

interface Download {
  id: string;
  url: string;
  title: string;
  uploader?: string;
  duration?: string | number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress?: number;
  error?: string;
  speed?: string;
  eta?: string;
  outputFile?: string | Array<{ success: boolean }>;
}

interface DownloadQueueProps {
  downloads: Download[];
  onRemoveDownload: (id: string) => void;
  onClearCompleted: () => void;
}

const DownloadQueue: React.FC<DownloadQueueProps> = ({ 
  downloads, 
  onRemoveDownload, 
  onClearCompleted 
}) => {
  const activeDownloads = downloads.filter(d => d.status === 'downloading');
  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const errorDownloads = downloads.filter(d => d.status === 'error');
  const pendingDownloads = downloads.filter(d => d.status === 'pending');

  const DownloadSection: React.FC<{
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    downloads: Download[];
    count: number;
    variant?: 'default' | 'secondary' | 'destructive';
  }> = ({ title, icon: Icon, downloads, count, variant = 'secondary' }) => {
    if (count === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <h3 className="font-medium text-sm">{title}</h3>
          <Badge variant={variant} className="text-xs">
            {count}
          </Badge>
        </div>
        <div className="space-y-2">
          {downloads.map(download => (
            <DownloadItem
              key={download.id}
              download={download}
              onRemove={onRemoveDownload}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Baixando atualmente
            <Badge variant="outline" className="text-xs">
              {downloads.length}
            </Badge>
          </CardTitle>
          
          {completedDownloads.length > 0 && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onClearCompleted}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Concluídos
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">Nenhum download na fila</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Adicione uma URL do YouTube acima para começar a baixar seus vídeos favoritos
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Downloads */}
            <DownloadSection
              title="Baixando"
              icon={Download}
              downloads={activeDownloads}
              count={activeDownloads.length}
              variant="default"
            />

            {/* Pending Downloads */}
            <DownloadSection
              title="Pendente"
              icon={Hourglass}
              downloads={pendingDownloads}
              count={pendingDownloads.length}
              variant="secondary"
            />

            {/* Completed Downloads */}
            <DownloadSection
              title="Concluído"
              icon={CheckCircle}
              downloads={completedDownloads}
              count={completedDownloads.length}
              variant="secondary"
            />

            {/* Error Downloads */}
            <DownloadSection
              title="Erro"
              icon={AlertCircle}
              downloads={errorDownloads}
              count={errorDownloads.length}
              variant="destructive"
            />

            {/* Add separators between sections */}
            {[activeDownloads, pendingDownloads, completedDownloads, errorDownloads]
              .filter(arr => arr.length > 0)
              .length > 1 && (
              <div className="space-y-6">
                {activeDownloads.length > 0 && (pendingDownloads.length > 0 || completedDownloads.length > 0 || errorDownloads.length > 0) && <Separator />}
                {pendingDownloads.length > 0 && (completedDownloads.length > 0 || errorDownloads.length > 0) && <Separator />}
                {completedDownloads.length > 0 && errorDownloads.length > 0 && <Separator />}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadQueue;
