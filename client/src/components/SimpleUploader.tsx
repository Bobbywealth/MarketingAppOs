import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SimpleUploaderProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string;
}

export function SimpleUploader({ 
  onUploadComplete, 
  accept = "image/*,video/*",
  maxSizeMB = 50,
  buttonText = "Upload Media"
}: SimpleUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File must be under ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      setProgress(30);

      // Upload file to backend
      const response = await apiRequest("POST", "/api/upload", formData);
      const data = await response.json();
      
      setProgress(90);
      
      setProgress(100);
      onUploadComplete(data.url);
      
      toast({
        title: "✅ Upload successful!",
        description: "Your file has been uploaded.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading... {progress}%
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    </>
  );
}

