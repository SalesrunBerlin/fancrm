
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface FileUploaderProps {
  onUploadSuccess: (filePath: string) => void;
  setUploading: (loading: boolean) => void;
}

export function FileUploader({ onUploadSuccess, setUploading }: FileUploaderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Bitte wählen Sie eine Datei aus");
      return;
    }

    if (!name) {
      toast.error("Bitte geben Sie einen Namen für das Icon ein");
      return;
    }

    setIsUploading(true);
    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `icons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('icons')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for the uploaded file
      const { data: publicUrl } = supabase.storage
        .from('icons')
        .getPublicUrl(filePath);

      // Call the success callback with the file path
      onUploadSuccess(publicUrl.publicUrl);

      toast.success("Datei erfolgreich hochgeladen");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(`Upload fehlgeschlagen: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploader
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        file={file}
        previewUrl={previewUrl}
        handleFileSelect={handleFileSelect}
        handleFileDrop={handleFileDrop}
      />

      <div className="flex justify-end">
        <Button 
          onClick={handleUpload} 
          disabled={uploading || !file || !name}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Icon
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
