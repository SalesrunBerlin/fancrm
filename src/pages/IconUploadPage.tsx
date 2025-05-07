
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function IconUploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#000000");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.gif']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        
        // Create preview URL
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        
        // If it's an SVG, read the content
        if (selectedFile.type === "image/svg+xml") {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              setSvgContent(result);
            }
          };
          reader.readAsText(selectedFile);
        } else {
          setSvgContent(null);
        }
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Sie müssen angemeldet sein, um Icons hochzuladen");
      return;
    }
    
    if (!file) {
      toast.error("Bitte wählen Sie eine Datei aus");
      return;
    }
    
    if (!name) {
      toast.error("Bitte geben Sie einen Namen für das Icon ein");
      return;
    }
    
    try {
      setUploading(true);
      
      // For SVG files, we already have the content
      if (svgContent) {
        // Save to database
        const { error } = await supabase
          .from("user_custom_icons")
          .insert({
            name,
            description,
            color,
            svg_content: svgContent,
            user_id: user.id
          });
        
        if (error) throw error;
        
        toast.success("Icon erfolgreich hochgeladen");
        navigate("/profile");
        return;
      }
      
      // For other file types, we need to upload to storage and get URL
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // First upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from("custom_icons")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from("custom_icons")
        .getPublicUrl(filePath);
      
      // Create a simple SVG wrapper for the image
      const imageUrl = urlData.publicUrl;
      const generatedSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <image href="${imageUrl}" width="64" height="64"/>
      </svg>`;
      
      // Save to database
      const { error } = await supabase
        .from("user_custom_icons")
        .insert({
          name,
          description,
          svg_content: generatedSvgContent,
          original_file_path: filePath,
          color,
          user_id: user.id
        });
      
      if (error) throw error;
      
      toast.success("Icon erfolgreich hochgeladen");
      navigate("/profile");
      
    } catch (error: any) {
      console.error("Fehler beim Hochladen:", error);
      toast.error(`Fehler beim Hochladen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Icon hochladen"
        description="Laden Sie ein Benutzerdefiniertes Icon hoch"
        backTo="/profile"
      />
      
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
            
            <div>
              <Label htmlFor="icon-color">Farbe</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="icon-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-24"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>
            
            <div>
              <Label>Icon-Datei hochladen*</Label>
              <div 
                {...getRootProps()} 
                className={`mt-1 border-2 border-dashed rounded-md p-6 cursor-pointer ${
                  isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
                }`}
              >
                <input {...getInputProps()} />
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreviewUrl(null);
                        setSvgContent(null);
                      }}
                    >
                      Andere Datei auswählen
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive
                        ? "Datei hier ablegen..."
                        : "Ziehen Sie eine Datei hierher oder klicken Sie, um eine Datei auszuwählen"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG, SVG oder GIF (max. 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/profile")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={!file || !name || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Icon hochladen
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
