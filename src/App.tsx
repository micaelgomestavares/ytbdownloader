import React, { useState, useEffect } from "react";
import {
  Header,
  UrlInput,
  DownloadQueue,
  StatusBar,
  FirstRunDialog,
} from "./components";
import { Button } from "./components/ui/button";
import { Trash2, Download } from "lucide-react";

// Types
interface Download {
  id: string;
  url: string;
  title: string;
  uploader?: string;
  duration?: string;
  status: "pending" | "downloading" | "completed" | "error";
  progress: number;
  error?: string;
  speed?: string;
  eta?: string;
  outputFile?: string;
}

interface QueueItem {
  url: string;
  title?: string;
  uploader?: string;
  duration?: string;
  thumbnail?: string;
  isLoading?: boolean;
}

interface AppSettings {
  quality: string;
  outputFolder: string;
}

interface BackendSettings {
  quality: string;
  downloadPath?: string;
  outputFolder?: string;
  format?: string;
}

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI: {
      // File system
      selectFolder: (title: string) => Promise<string | null>;
      getAppDataPath: () => Promise<string>;
      getDownloadsPath: () => Promise<string>;
      showInFolder: (filePath: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>; // Settings
      getSettings: () => Promise<AppSettings | null>;
      saveSettings: (
        settings: any
      ) => Promise<{ success: boolean; error?: string }>;
      loadSettings: () => Promise<AppSettings | null>; // Downloads
      addDownload: (
        url: string,
        options: {
          quality: string;
          format: string;
          outputPath: string;
          title?: string;
          uploader?: string;
          duration?: string;
        }
      ) => Promise<string>;
      cancelDownload: (id: string) => Promise<boolean>;
      getDownloads: () => Promise<Download[]>;
      removeDownload: (id: string) => Promise<boolean>;
      getVideoInfo: (url: string) => Promise<{
        title: string;
        uploader?: string;
        duration?: string;
        thumbnail?: string;
      }>;

      // Progress listeners
      onDownloadProgress: (callback: (data: Download) => void) => () => void;
      onDownloadComplete: (callback: (data: Download) => void) => () => void;
      onDownloadError: (callback: (data: Download) => void) => () => void;
    };
  }
}

const App: React.FC = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [downloadQueue, setDownloadQueue] = useState<QueueItem[]>([]); // Mudança para QueueItem
  const [isDownloading, setIsDownloading] = useState<boolean>(false); // Estado de download ativo
  const [showFirstRunDialog, setShowFirstRunDialog] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>({
    quality: "best",
    outputFolder: "",
  });
  const dependencies = {
    checked: true,
    available: true,
    message: "Pronto para usar",
  };
  useEffect(() => {
    loadSettings();
    loadDownloads();

    const cleanup = setupEventListeners();
    return cleanup;
  }, []);
  const loadSettings = async (): Promise<void> => {
    try {
      const savedSettings: any = await window.electronAPI.getSettings();
      if (savedSettings) {
        // Verificar se é primeira execução
        if (savedSettings.isFirstRun) {
          setShowFirstRunDialog(true);
        }

        setSettings({
          quality: savedSettings.quality || "best",
          outputFolder:
            savedSettings.downloadPath || savedSettings.outputFolder || "",
        });
      } else {
        // Set default output path
        const defaultPath = await window.electronAPI.getDownloadsPath();
        setSettings((prev) => ({ ...prev, outputFolder: defaultPath }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadDownloads = async (): Promise<void> => {
    try {
      const existingDownloads = await window.electronAPI.getDownloads();
      setDownloads(existingDownloads);
    } catch (error) {
      console.error("Error loading downloads:", error);
    }
  };
  const setupEventListeners = (): (() => void) => {
    const unsubscribeProgress = window.electronAPI.onDownloadProgress(
      (data) => {
        setDownloads((prev) =>
          prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
        );
      }
    );

    const unsubscribeComplete = window.electronAPI.onDownloadComplete(
      (data) => {
        setDownloads((prev) =>
          prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
        );
      }
    );

    const unsubscribeError = window.electronAPI.onDownloadError((data) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    });

    // Return cleanup function
    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
    };
  };
  const addToQueue = async (url: string): Promise<void> => {
    try {
      // Validar URL
      if (!url.trim()) {
        throw new Error("URL não pode estar vazia");
      }

      // Verificar se já está na fila
      if (downloadQueue.some((item) => item.url === url)) {
        throw new Error("URL já está na fila de downloads");
      }

      // Criar item da fila inicialmente só com URL
      const queueItem: QueueItem = {
        url,
        title: "Carregando informações...",
        isLoading: true,
      };

      // Adicionar à fila
      setDownloadQueue((prev) => [...prev, queueItem]);

      // Buscar informações do vídeo em background
      try {
        const videoInfo = await window.electronAPI.getVideoInfo(url);

        // Atualizar com as informações do vídeo
        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.url === url
              ? {
                  ...item,
                  title: videoInfo.title || "Vídeo do YouTube",
                  uploader: videoInfo.uploader,
                  duration: videoInfo.duration,
                  thumbnail: videoInfo.thumbnail,
                  isLoading: false,
                }
              : item
          )
        );
      } catch (error) {
        // Se falhar em buscar info, manter apenas com URL
        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.url === url
              ? {
                  ...item,
                  title: "Vídeo do YouTube",
                  isLoading: false,
                }
              : item
          )
        );
      }

      console.log("URL adicionada à fila:", url);
    } catch (error: any) {
      console.error("Error adding to queue:", error);

      // Add error download to UI
      const errorDownload: Download = {
        id: Date.now().toString(),
        url,
        title: "Erro ao adicionar à fila",
        status: "error",
        progress: 0,
        error: error.message || "Erro desconhecido",
      };

      setDownloads((prev) => [...prev, errorDownload]);
    }
  };
  const startAllDownloads = async (): Promise<void> => {
    if (downloadQueue.length === 0) {
      console.log("Nenhuma URL na fila para baixar");
      return;
    }

    setIsDownloading(true);

    try {
      const outputPath =
        settings.outputFolder || (await window.electronAPI.getDownloadsPath());

      // Baixar todas as URLs da fila
      for (const queueItem of downloadQueue) {
        try {
          const downloadId = await window.electronAPI.addDownload(
            queueItem.url,
            {
              quality: settings.quality || "best",
              format: "mp3",
              outputPath: outputPath,
              title: queueItem.title,
              uploader: queueItem.uploader,
              duration: queueItem.duration,
            }
          );

          // Adicionar download à lista imediatamente
          const newDownload: Download = {
            id: downloadId,
            url: queueItem.url,
            title: queueItem.title || "Preparando download...",
            uploader: queueItem.uploader,
            duration: queueItem.duration,
            status: "pending",
            progress: 0,
          };

          setDownloads((prev) => [...prev, newDownload]);

          console.log(
            "Download started with ID:",
            downloadId,
            "for URL:",
            queueItem.url
          );
        } catch (error: any) {
          console.error(
            "Error starting download for URL:",
            queueItem.url,
            error
          );

          // Add error download to UI
          const errorDownload: Download = {
            id: Date.now().toString(),
            url: queueItem.url,
            title: "Erro ao iniciar download",
            status: "error",
            progress: 0,
            error: error.message || "Erro desconhecido",
          };

          setDownloads((prev) => [...prev, errorDownload]);
        }
      }

      // Limpar a fila após iniciar todos os downloads
      setDownloadQueue([]);
    } catch (error: any) {
      console.error("Error starting downloads:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const removeFromQueue = (url: string): void => {
    setDownloadQueue((prev) =>
      prev.filter((queueItem) => queueItem.url !== url)
    );
  };

  const clearQueue = (): void => {
    setDownloadQueue([]);
  };

  const removeDownload = async (downloadId: string): Promise<void> => {
    try {
      await window.electronAPI.removeDownload(downloadId);
      setDownloads((prev) => prev.filter((d) => d.id !== downloadId));
    } catch (error) {
      console.error("Error removing download:", error);
    }
  };
  const clearCompleted = (): void => {
    // Apenas remover downloads completos da lista local
    setDownloads((prev) => prev.filter((d) => d.status !== "completed"));
  };
  const updateSettings = async (
    newSettings: Partial<AppSettings>
  ): Promise<void> => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      // Mapear outputFolder para downloadPath quando salvar no backend
      const settingsToSave = {
        quality: updatedSettings.quality,
        downloadPath: updatedSettings.outputFolder,
        format: "mp3",
      };
      await window.electronAPI.saveSettings(settingsToSave);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };
  const handleFirstRunComplete = async (
    downloadPath: string
  ): Promise<void> => {
    try {
      // Salvar a configuração escolhida
      const settingsToSave = {
        quality: settings.quality,
        downloadPath: downloadPath,
        format: "mp3",
      };

      await window.electronAPI.saveSettings(settingsToSave);

      // Atualizar estado local
      setSettings((prev) => ({ ...prev, outputFolder: downloadPath }));

      // Fechar diálogo
      setShowFirstRunDialog(false);

      console.log("✅ Primeira execução configurada:", downloadPath);
    } catch (error) {
      console.error("Erro ao salvar configuração inicial:", error);
    }
  };

  const handleOpenDownloads = async (): Promise<void> => {
    try {
      await window.electronAPI.showInFolder(settings.outputFolder);
    } catch (error) {
      console.error("Error opening downloads folder:", error);
    }
  };

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const folderPath = await window.electronAPI.selectFolder(
        "Selecionar pasta de downloads"
      );
      if (folderPath) {
        await updateSettings({ outputFolder: folderPath });
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      {/* Diálogo de Primeira Execução */}
      <FirstRunDialog
        open={showFirstRunDialog}
        onComplete={handleFirstRunComplete}
      />

      <Header
        onOpenDownloads={handleOpenDownloads}
        onSelectFolder={handleSelectFolder}
        settings={settings}
        onSettingsChange={updateSettings}
      />
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <UrlInput
            onAddDownload={addToQueue}
            disabled={!dependencies.available}
          />
          {/* Fila de Downloads */}
          {downloadQueue.length > 0 && (
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Fila de Downloads ({downloadQueue.length})
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={startAllDownloads}
                    disabled={isDownloading}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? "Baixando..." : "Baixar"}
                  </Button>
                  <Button
                    onClick={clearQueue}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar Fila
                  </Button>
                </div>
              </div>{" "}
              <div className="space-y-2">
                {downloadQueue.map((queueItem, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted p-3 rounded"
                  >
                    <div className="flex-1 mr-4">
                      <div className="text-sm font-medium truncate">
                        {queueItem.isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            {queueItem.title}
                          </div>
                        ) : (
                          queueItem.title
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {queueItem.url}
                      </div>
                      {queueItem.uploader && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Por: {queueItem.uploader}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => removeFromQueue(queueItem.url)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/80"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DownloadQueue
          downloads={downloads}
          onRemoveDownload={removeDownload}
          onClearCompleted={clearCompleted}
        />
      </main>

      <StatusBar
        dependencies={dependencies}
        downloadsCount={downloads.length}
        activeDownloads={
          downloads.filter((d) => d.status === "downloading").length
        }
      />
    </div>
  );
};

export default App;
