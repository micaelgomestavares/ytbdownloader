import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  HelpCircle,
  Hourglass,
  Save,
  User,
  X,
} from "lucide-react";
import type React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Progress } from "./ui/progress";

interface IDownload {
  id: string;
  url: string;
  title: string;
  uploader?: string;
  duration?: string | number;
  status: "pending" | "downloading" | "completed" | "error";
  progress?: number;
  error?: string;
  speed?: string;
  eta?: string;
  outputFile?: string | Array<{ success: boolean }>;
}

interface DownloadItemProps {
  download: IDownload;
  onRemove: (id: string) => void;
}

const DownloadItem: React.FC<DownloadItemProps> = ({ download, onRemove }) => {
  const getStatusConfig = (status: IDownload["status"]) => {
    switch (status) {
      case "pending":
        return {
          icon: Hourglass,
          text: "Pendente",
          variant: "secondary" as const,
          className: "text-yellow-600",
        };
      case "downloading":
        return {
          icon: Download,
          text: "Baixando",
          variant: "default" as const,
          className: "text-blue-600",
        };
      case "completed":
        return {
          icon: CheckCircle,
          text: "Baixada",
          variant: "default" as const,
          className: "text-green-600",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Erro",
          variant: "destructive" as const,
          className: "text-red-600",
        };
      default:
        return {
          icon: HelpCircle,
          text: "Desconhecido",
          variant: "secondary" as const,
          className: "text-gray-600",
        };
    }
  };

  const formatDuration = (duration?: string | number): string => {
    if (!duration || duration === "Duração não disponível") return "";

    // If duration is already formatted, return as is
    if (typeof duration === "string" && duration.includes(":")) {
      return duration;
    }

    // If duration is in seconds, convert to mm:ss format
    if (typeof duration === "number" || !Number.isNaN(Number(duration))) {
      const seconds = parseInt(String(duration));
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    return String(duration);
  };

  const truncateTitle = (title: string, maxLength: number = 60): string => {
    if (title.length <= maxLength) return title;
    return `${title.substring(0, maxLength)}...`;
  };

  const statusConfig = getStatusConfig(download.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={`w-full ${
        download.status === "error" ? "border-destructive" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`mt-1 ${statusConfig.className}`}>
              <StatusIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-medium text-sm leading-tight break-words mb-1"
                title={download.title}
              >
                {truncateTitle(download.title)}
              </h3>
              {/* URL em uma linha separada */}
              <div className="text-xs text-muted-foreground break-all mb-2 font-mono bg-muted/50 px-2 py-1 rounded">
                {download.url}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {download.uploader && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{download.uploader}</span>
                  </div>
                )}

                {download.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(download.duration)}</span>
                  </div>
                )}
                <Badge
                  variant={
                    download.status === "completed"
                      ? "default"
                      : statusConfig.variant
                  }
                  className={`text-xs ${
                    download.status === "completed"
                      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100"
                      : ""
                  }`}
                >
                  {download.status === "completed"
                    ? "Baixada"
                    : statusConfig.text}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(download.id)}
            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {download.status === "downloading" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso do download</span>
              <span className="font-medium">
                {(download.progress || 0).toFixed(1)}%
              </span>
            </div>
            <Progress value={download.progress || 0} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {download.speed && <span>Velocidade: {download.speed}</span>}
              {download.eta && <span>Tempo restante: {download.eta}</span>}
            </div>
          </div>
        )}
        {download.status === "error" && download.error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{download.error}</p>
          </div>
        )}
        {download.status === "completed" && download.outputFile && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-200 dark:bg-green-950 dark:border-green-800">
            <Save className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Download concluído
              {Array.isArray(download.outputFile) && (
                <span className="ml-1">
                  - {download.outputFile.filter((r) => r.success).length}
                  arquivos
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadItem;
