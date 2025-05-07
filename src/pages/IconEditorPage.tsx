import { useState, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { IconPreview } from "@/components/icon-editor/IconPreview";
import { ColorPicker } from "@/components/icon-editor/ColorPicker";
import { FileUploader } from "@/components/icon-editor/FileUploader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";

export default function IconEditorPage() {
  const [iconName, setIconName] = useState("");
  const [iconDescription, setIconDescription] = useState("");
  const [svgContent, setSvgContent] = useState("");
  const [processedSvgContent, setProcessedSvgContent] = useState<string | null>(null);
  const [color, setColor] = useState("#000000");
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const previewUrl = useRef<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSvgContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSvgContent = e.target.value;
    setSvgContent(newSvgContent);
    try {
      setProcessedSvgContent(newSvgContent);
    } catch (error) {
      console.error("Error processing SVG content:", error);
      setProcessedSvgContent(null);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  const handleUploadSuccess = (filePath: string) => {
    console.log("File upload successful:", filePath);
    // Fix: Changed setPreviewUrl to just use previewUrl from state
    previewUrl.current = filePath;
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Du bist nicht angemeldet.");
      return;
    }

    if (!iconName || !svgContent) {
      toast.error("Bitte füllen Sie alle Felder aus.");
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await supabase
        .from("icons")
        .insert([
          {
            name: iconName,
            description: iconDescription,
            svg_content: svgContent,
            color: color,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating icon:", error);
        toast.error("Fehler beim Erstellen des Icons.");
        return;
      }

      toast.success("Icon erfolgreich erstellt!");
      navigate("/settings/icons");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader title="Icon Editor" description="Create and customize your own icons." />

      {currentStep === 0 && (
        <FileUploader onUploadSuccess={handleUploadSuccess} setUploading={setUploading} />
      )}

      {currentStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="icon-name">Icon Name</Label>
              <Input
                id="icon-name"
                type="text"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="icon-description">Icon Beschreibung</Label>
              <Textarea
                id="icon-description"
                value={iconDescription}
                onChange={(e) => setIconDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="svg-content">SVG Inhalt</Label>
              <Textarea
                id="svg-content"
                className="min-h-[200px]"
                value={svgContent}
                onChange={handleSvgContentChange}
              />
            </div>
          </div>
          <div className="space-y-6">
            <ColorPicker
              color={color}
              setColor={handleColorChange}
              processedSvgContent={processedSvgContent}
            />
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => setCurrentStep(0)}>
            <Upload className="w-4 h-4 mr-2" />
            Datei erneut hochladen
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Icon erstellen
          </Button>
        </div>
      )}

      {previewUrl.current && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Datei erfolgreich hochgeladen!</AlertTitle>
          <AlertDescription>
            Sie können jetzt den Icon-Editor verwenden, um Ihr Icon anzupassen.
          </AlertDescription>
        </Alert>
      )}

      {processedSvgContent && (
        <IconPreview processedSvgContent={processedSvgContent} color={color} size="lg" />
      )}
    </div>
  );
}
