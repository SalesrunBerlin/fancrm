
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "lucide-react";

interface ImageUploaderProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  file: File | null;
  previewUrl: string | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function ImageUploader({
  name,
  setName,
  description,
  setDescription,
  file,
  previewUrl,
  handleFileSelect,
  handleFileDrop
}: ImageUploaderProps) {
  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-md p-6 cursor-pointer hover:border-primary transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center text-center">
          {previewUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <img 
                  src={previewUrl} 
                  alt="Vorschau" 
                  className="h-32 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground">{file?.name}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Image className="h-16 w-16 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Ziehen Sie eine Bilddatei hierher oder klicken Sie, um eine Datei auszuwählen
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, SVG oder GIF
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <Label htmlFor="icon-name">Name*</Label>
        <Input
          id="icon-name"
          placeholder="Geben Sie einen Namen für das Icon ein"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="icon-description">Beschreibung</Label>
        <Textarea
          id="icon-description"
          placeholder="Fügen Sie eine optionale Beschreibung hinzu"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}
