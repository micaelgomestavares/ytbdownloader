import { AlertTriangle, Clipboard, Download, Link2, List, Loader2, Youtube } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface UrlInputProps {
  onAddDownload: (url: string) => Promise<void>;
  disabled: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onAddDownload, disabled }) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    setIsProcessing(true);

    try {
      await onAddDownload(url.trim());
      setUrl('');
    } catch (error) {
      console.error('Erro ao adicionar download:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/;
    return youtubeRegex.test(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (isValidYouTubeUrl(text)) {
        setUrl(text);
      }
    } catch (err) {
      console.error('Erro ao colar da área de transferência:', err);
    }
  };

  const getUrlType = (url: string) => {
    if (!url) return null;

    if (url.includes('playlist?list=')) {
      return { type: 'playlist', icon: List, label: 'Playlist' };
    } else if (isValidYouTubeUrl(url)) {
      return { type: 'video', icon: Youtube, label: 'Vídeo' };
    }

    return null;
  };

  const urlType = getUrlType(url);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Adicionar Download
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole a URL do YouTube aqui (vídeo ou playlist)..."
                disabled={disabled || isProcessing}
                className="w-full"
                required
              />

              {url && urlType && (
                <div className="flex items-center gap-2">
                  <urlType.icon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">
                    {urlType.label}
                  </Badge>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePaste}
              disabled={disabled || isProcessing}
              title="Colar da área de transferência"
            >
              <Clipboard className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              disabled={disabled || isProcessing || !url.trim()}
              className="gap-2 min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Adicionar à fila
                </>
              )}
            </Button>
          </div>
        </form>

        {disabled && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-md border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">yt-dlp não encontrado</p>
              <p className="text-xs text-destructive/80">
                Instale com:{' '}
                <code className="bg-destructive/20 px-1 rounded">pip install yt-dlp</code>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-2">Exemplos de URLs aceitas:</p>
            <div className="space-y-1 font-mono">
              <div className="flex items-center gap-2">
                <Youtube className="h-3 w-3" />
                <code>https://www.youtube.com/watch?v=VIDEO_ID</code>
              </div>
              <div className="flex items-center gap-2">
                <Youtube className="h-3 w-3" />
                <code>https://youtu.be/VIDEO_ID</code>
              </div>
              <div className="flex items-center gap-2">
                <List className="h-3 w-3" />
                <code>https://www.youtube.com/playlist?list=PLAYLIST_ID</code>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UrlInput;
