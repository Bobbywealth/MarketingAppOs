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

      // Get upload URL from backend
      const response = await apiRequest("POST", "/api/objects/upload", {
        filename: `content-${Date.now()}-${file.name}`,
        contentType: file.type,
      });
      const data = await response.json();
      
      setProgress(30);

      // Upload file to the pre-signed URL
      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      setProgress(90);

      // Extract the URL without query parameters
      const uploadedUrl = data.uploadUrl.split('?')[0];
      
      setProgress(100);
      onUploadComplete(uploadedUrl);
      
      toast({
        title: "✅ Upload successful!",
        description: "Your file has been uploaded.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload file. Please try again.",
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

