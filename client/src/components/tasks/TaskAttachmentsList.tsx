import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  File,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Upload,
  X,
  Download,
  Eye,
  Trash2,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface TaskAttachmentsListProps {
  taskId: string;
  attachments?: any[];
  onUpload?: (files: FileList) => void;
  onDelete?: (attachmentId: string) => void;
  readOnly?: boolean;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  image: <Image className="w-6 h-6 text-blue-500" />,
  video: <Film className="w-6 h-6 text-purple-500" />,
  audio: <Music className="w-6 h-6 text-green-500" />,
  pdf: <FileText className="w-6 h-6 text-red-500" />,
  document: <FileText className="w-6 h-6 text-blue-500" />,
  archive: <Archive className="w-6 h-6 text-yellow-500" />,
  default: <File className="w-6 h-6 text-gray-500" />,
};

function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.startsWith("text/")
  ) {
    return "document";
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  ) {
    return "archive";
  }
  return "default";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function TaskAttachmentsList({
  taskId,
  attachments = [],
  readOnly = false,
}: TaskAttachmentsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // Fetch attachments if not provided
  const { data: fetchedAttachments = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${taskId}/attachments`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tasks/${taskId}/attachments`);
      return res.json();
    },
    enabled: !attachments.length,
  });

  const allAttachments = attachments.length > 0 ? attachments : fetchedAttachments;

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      // Get upload URL from server
      const urlRes = await apiRequest("POST", "/api/upload-url", {
        filename: files[0].name,
        contentType: files[0].type,
      });
      const { uploadUrl, publicUrl } = await urlRes.json();

      // Upload to storage
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: files[0],
        headers: {
          "Content-Type": files[0].type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      // Create attachment record
      const attachmentRes = await apiRequest("POST", `/api/tasks/${taskId}/attachments`, {
        fileName: files[0].name,
        fileSize: files[0].size,
        fileType: files[0].type,
        objectPath: publicUrl,
      });

      return attachmentRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      toast({ title: "File uploaded successfully" });
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: () => {
      toast({ title: "Failed to upload file", variant: "destructive" });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      toast({ title: "File deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete file", variant: "destructive" });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files[0].size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(50);
    uploadMutation.mutate(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (files[0].size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(50);
    uploadMutation.mutate(files);
  };

  const handleDelete = (attachmentId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(attachmentId);
    }
  };

  const getIcon = (mimeType: string) => {
    return fileTypeIcons[getFileType(mimeType)] || fileTypeIcons.default;
  };

  if (readOnly && allAttachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!readOnly && (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="w-full h-2" />
            </div>
          ) : (
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Drop files here or click to upload
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-2">Maximum file size: 10MB</p>
        </div>
      )}

      {/* Attachments List */}
      {allAttachments.length > 0 && (
        <div className="space-y-2">
          {allAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="shrink-0">{getIcon(attachment.fileType || "")}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(attachment.objectPath, "_blank")}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = attachment.objectPath;
                      a.download = attachment.fileName;
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(attachment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!readOnly && allAttachments.length === 0 && !isUploading && (
        <div className="text-center py-8 text-muted-foreground">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No attachments yet</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!selectedPreview} onOpenChange={() => setSelectedPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {selectedPreview && (
            <div className="flex items-center justify-center">
              <img
                src={selectedPreview}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPreview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TaskAttachmentsList;
