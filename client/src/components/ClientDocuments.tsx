import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Upload,
  FileText,
  Image,
  Video,
  FileIcon,
  Trash2,
  Download,
  Plus,
  Loader2,
  Eye,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClientDocumentsProps {
  clientId: string;
}

interface ClientDocument {
  id: string;
  name: string;
  description?: string;
  objectPath: string;
  fileType?: string;
  fileSize?: number;
  uploadedBy: number;
  createdAt: string;
}

export function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch client documents
  const { data: documents = [], isLoading } = useQuery<ClientDocument[]>({
    queryKey: [`/api/clients/${clientId}/documents`],
    enabled: !!clientId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      
      const uploadRes = await apiRequest("POST", `/api/clients/${clientId}/documents/upload`, formData);
      const uploadData = await uploadRes.json();
      
      // Create document records for each uploaded file
      const promises = uploadData.uploadedFiles.map((fileData: any) => {
        const docData = {
          name: documentName || fileData.originalName,
          description: documentDescription,
          fileType: getFileType(fileData.mimeType),
          fileSize: fileData.fileSize,
          fileUrl: fileData.fileUrl,
          originalName: fileData.originalName,
          mimeType: fileData.mimeType,
        };
        
        return apiRequest("POST", `/api/clients/${clientId}/documents`, docData);
      });
      
      await Promise.all(promises);
      return uploadData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents`] });
      toast({ title: "Documents Uploaded", description: "Files have been uploaded successfully." });
      setIsUploadDialogOpen(false);
      setUploadFiles([]);
      setDocumentName("");
      setDocumentDescription("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Upload Failed", 
        description: error.message || "Failed to upload documents.",
        variant: "destructive" 
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/clients/${clientId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents`] });
      toast({ title: "Document Deleted", description: "Document has been removed." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Delete Failed", 
        description: error.message || "Failed to delete document.",
        variant: "destructive" 
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
    
    // Auto-set document name if only one file
    if (files.length === 1) {
      setDocumentName(files[0].name);
    } else if (files.length > 1) {
      setDocumentName(`${files.length} files`);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(uploadFiles);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileType?: string, mimeType?: string) => {
    const type = fileType?.toLowerCase();
    const mime = mimeType?.toLowerCase();
    
    if (mime?.startsWith('image/')) return Image;
    if (mime?.startsWith('video/')) return Video;
    if (mime?.includes('pdf') || type === 'pdf') return FileText;
    return FileIcon;
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('sheet')) return 'document';
    return 'file';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileUrl = (objectPath: string): string => {
    // Since objectPath now contains just the filename, construct the full URL
    return `/uploads/${objectPath}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & Media
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage client documents, images, and videos
          </p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload images, videos, PDFs, and other documents for this client.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Files</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images, videos, PDFs, documents up to 200MB each
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files:</p>
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4" />
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {formatFileSize(file.size)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter a name for the document(s)"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={isUploading || uploadFiles.length === 0}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No documents yet</p>
            <p className="text-sm mb-4">Upload client documents, images, and videos to get started.</p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const IconComponent = getFileIcon(doc.fileType, undefined);
              
              return (
                <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {doc.fileType || 'file'}
                          </Badge>
                          {doc.fileSize && (
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getFileUrl(doc.objectPath), '_blank')}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = getFileUrl(doc.objectPath);
                          link.download = doc.name;
                          link.click();
                        }}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
                            deleteMutation.mutate(doc.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Uploaded {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}