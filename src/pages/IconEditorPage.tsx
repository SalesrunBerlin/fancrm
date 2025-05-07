
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fabric } from "fabric";
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
import { 
  ArrowLeft, Save, Loader2, ChevronRight, ChevronLeft, 
  Image, PaintBucket, Square, Crop, AlertTriangle 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditorStep = "upload" | "crop" | "threshold" | "colorize" | "save";
type ThresholdLevel = 1 | 2 | 3 | 4 | 5;

export default function IconEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#000000");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<EditorStep>("upload");
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [processedSvgContent, setProcessedSvgContent] = useState<string | null>(null);
  const [thresholdLevel, setThresholdLevel] = useState<ThresholdLevel>(3);
  const [showHelp, setShowHelp] = useState(false);
  const [isCropped, setIsCropped] = useState(false);
  
  // Canvas references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const imageRef = useRef<fabric.Image | null>(null);
  const rectRef = useRef<fabric.Rect | null>(null);
  
  // Set up canvas when the component mounts or step changes
  useEffect(() => {
    if (step === "crop" && canvasRef.current && previewUrl) {
      // Initialize Fabric canvas
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: 500,
        height: 500,
        backgroundColor: "#f0f0f0",
      });
      
      // Load the image
      fabric.Image.fromURL(previewUrl, (img) => {
        // Scale the image to fit within the canvas
        const scale = Math.min(
          (fabricCanvasRef.current?.width || 500) / img.width!, 
          (fabricCanvasRef.current?.height || 500) / img.height!
        ) * 0.8;
        
        img.scale(scale);
        img.set({
          left: 250 - (img.width! * scale / 2),
          top: 250 - (img.height! * scale / 2),
          selectable: false,
          hoverCursor: "default",
        });
        
        imageRef.current = img;
        fabricCanvasRef.current?.add(img);
        
        // Add crop rectangle (centered on the image)
        const imgWidth = img.width! * scale;
        const imgHeight = img.height! * scale;
        const rectWidth = imgWidth * 0.8;
        const rectHeight = imgHeight * 0.8;
        
        rectRef.current = new fabric.Rect({
          left: img.left! + imgWidth * 0.1,
          top: img.top! + imgHeight * 0.1,
          width: rectWidth,
          height: rectHeight,
          fill: "rgba(0,0,0,0.1)",
          stroke: "#0000FF",
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          cornerColor: "#0000FF",
          transparentCorners: false,
          cornerSize: 10,
          hasRotatingPoint: false,
        });
        
        fabricCanvasRef.current?.add(rectRef.current);
        fabricCanvasRef.current?.setActiveObject(rectRef.current);
        fabricCanvasRef.current?.renderAll();
      });
      
      return () => {
        fabricCanvasRef.current?.dispose();
        fabricCanvasRef.current = null;
      };
    }
    
    if (step === "threshold" && canvasRef.current && imageRef.current) {
      // Apply the threshold to the cropped image if needed
      applyThreshold();
    }
  }, [step, previewUrl]);
  
  // Apply threshold when the threshold level changes
  useEffect(() => {
    if (step === "threshold") {
      applyThreshold();
    }
  }, [thresholdLevel]);
  
  const getThresholdValue = (level: ThresholdLevel): number => {
    // Map the 5 levels to threshold values (0-255)
    switch (level) {
      case 1: return 50;  // Very light (mostly black)
      case 2: return 100;
      case 3: return 150; // Medium
      case 4: return 200;
      case 5: return 225; // Very dark (mostly white)
      default: return 150;
    }
  };
  
  const cropImage = () => {
    if (!fabricCanvasRef.current || !imageRef.current || !rectRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const rect = rectRef.current;
    const img = imageRef.current;
    
    // Create offscreen canvas for cropping
    const offscreenCanvas = document.createElement("canvas");
    const ctx = offscreenCanvas.getContext("2d");
    if (!ctx) return;
    
    // Get the image element
    const imgEl = img.getElement() as HTMLImageElement;
    
    // Get the crop dimensions in relation to the scaled image
    const scaleX = img.scaleX || 1;
    const scaleY = img.scaleY || 1;
    const imgLeft = img.left || 0;
    const imgTop = img.top || 0;
    const rectLeft = rect.left || 0;
    const rectTop = rect.top || 0;
    
    // Calculate the crop area in relation to the original image
    const cropX = (rectLeft - imgLeft) / scaleX;
    const cropY = (rectTop - imgTop) / scaleY;
    const cropWidth = rect.width! / scaleX;
    const cropHeight = rect.height! / scaleY;
    
    // Set the canvas dimensions to the crop size
    offscreenCanvas.width = cropWidth;
    offscreenCanvas.height = cropHeight;
    
    // Draw the cropped portion
    ctx.drawImage(
      imgEl,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    // Create a new image from the cropped canvas
    const croppedDataUrl = offscreenCanvas.toDataURL();
    
    // Update the preview with the cropped image
    setPreviewUrl(croppedDataUrl);
    setIsCropped(true);
    
    // Recreate the canvas with the cropped image
    canvas.dispose();
    fabricCanvasRef.current = null;
    
    fabric.Image.fromURL(croppedDataUrl, (newImg) => {
      // Create new canvas for the cropped image
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: 500,
        height: 500,
        backgroundColor: "#f0f0f0",
      });
      
      // Scale the image to fit within the canvas
      const scale = Math.min(
        (500) / newImg.width!, 
        (500) / newImg.height!
      ) * 0.8;
      
      newImg.scale(scale);
      newImg.set({
        left: 250 - (newImg.width! * scale / 2),
        top: 250 - (newImg.height! * scale / 2),
        selectable: false,
        hoverCursor: "default",
      });
      
      imageRef.current = newImg;
      fabricCanvasRef.current.add(newImg);
      fabricCanvasRef.current.renderAll();
    });
  };
  
  const applyThreshold = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // If we have a cropped image or original image
    const imgSrc = previewUrl;
    if (!imgSrc) return;
    
    // Create an image element for processing
    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create an offscreen canvas to process the image
      const offscreenCanvas = document.createElement("canvas");
      const offCtx = offscreenCanvas.getContext("2d");
      if (!offCtx) return;
      
      // Set dimensions
      offscreenCanvas.width = img.width;
      offscreenCanvas.height = img.height;
      
      // Draw the image onto the offscreen canvas
      offCtx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = offCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      const data = imageData.data;
      
      // Get threshold value based on level
      const thresholdValue = getThresholdValue(thresholdLevel);
      
      // Apply threshold
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const value = brightness >= thresholdValue ? 255 : 0;
        data[i] = value;     // Red
        data[i + 1] = value; // Green
        data[i + 2] = value; // Blue
      }
      
      // Put the image data back
      offCtx.putImageData(imageData, 0, 0);
      
      // Draw the processed image on the visible canvas
      canvas.width = offscreenCanvas.width;
      canvas.height = offscreenCanvas.height;
      ctx.drawImage(offscreenCanvas, 0, 0);
      
      // Generate SVG from the threshold image
      const svg = generateSVGFromCanvas(offscreenCanvas);
      setProcessedSvgContent(svg);
      
      // Scale the canvas display for better view
      const scale = Math.min(
        300 / canvas.width,
        300 / canvas.height
      );
      canvas.style.width = `${canvas.width * scale}px`;
      canvas.style.height = `${canvas.height * scale}px`;
    };
    
    img.src = imgSrc;
  };
  
  const generateSVGFromCanvas = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create an SVG representation
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="64" height="64">
      <path fill="currentColor" d="`;
    
    // Simple bitmap tracing algorithm
    let path = "";
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx] === 0) { // Black pixel found
          path += `M${x},${y} `;
          // Add a small rectangle (1x1) for each black pixel
          path += `h1 v1 h-1 z `;
        }
      }
    }
    
    svg += path + '"/></svg>';
    return svg;
  };
  
  const handleFileChange = (file: File) => {
    if (file) {
      setFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // If it's an SVG, read the content
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            setSvgContent(result);
          }
        };
        reader.readAsText(file);
      } else {
        setSvgContent(null);
      }
      
      // Reset the cropped state
      setIsCropped(false);
    }
  };
  
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };
  
  const handleNextStep = () => {
    switch (step) {
      case "upload":
        if (!file) {
          toast.error("Bitte wählen Sie eine Datei aus");
          return;
        }
        setStep("crop");
        break;
      case "crop":
        if (!isCropped) {
          toast.error("Bitte stellen Sie das Bild frei, indem Sie den 'Freistellen' Button klicken");
          return;
        }
        setStep("threshold");
        break;
      case "threshold":
        setStep("colorize");
        break;
      case "colorize":
        setStep("save");
        break;
      default:
        break;
    }
  };
  
  const handlePrevStep = () => {
    switch (step) {
      case "crop":
        setStep("upload");
        break;
      case "threshold":
        setStep("crop");
        setIsCropped(false); // Reset cropped state when going back
        break;
      case "colorize":
        setStep("threshold");
        break;
      case "save":
        setStep("colorize");
        break;
      default:
        break;
    }
  };
  
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
    
    if (!processedSvgContent) {
      toast.error("Icon konnte nicht verarbeitet werden");
      return;
    }
    
    try {
      setUploading(true);
      
      // Apply color to the SVG
      const coloredSvg = processedSvgContent.replace(/fill="([^"]*)"/, `fill="${color}"`);
      
      // Save to database
      const { error } = await supabase
        .from("user_custom_icons")
        .insert({
          name,
          description,
          color,
          svg_content: coloredSvg,
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
  
  const renderThresholdButtons = () => {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <Button
              key={level}
              variant={thresholdLevel === level ? "default" : "outline"}
              onClick={() => setThresholdLevel(level as ThresholdLevel)}
              className="relative p-1 h-16"
            >
              <div className="text-xs mb-1">Stufe {level}</div>
              <div 
                className="w-full h-2 rounded-sm" 
                style={{
                  background: `linear-gradient(to right, black ${(level/5)*100}%, white ${(level/5)*100}%)`
                }}
              ></div>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Stufe 1: Mehr dunkle Bereiche | Stufe 5: Mehr helle Bereiche
        </p>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Icon-Editor"
        description="Erstellen Sie ein benutzerdefiniertes Icon mit erweiterter Bearbeitung"
        backTo="/profile"
        actions={
          <Button variant="outline" onClick={() => setShowHelp(true)}>
            Hilfe
          </Button>
        }
      />
      
      <div className="mb-6">
        <div className="flex space-x-2 border-b">
          <div className={`pb-2 px-1 ${step === "upload" ? "border-b-2 border-primary font-medium text-primary" : ""}`}>
            1. Upload
          </div>
          <div className={`pb-2 px-1 ${step === "crop" ? "border-b-2 border-primary font-medium text-primary" : ""}`}>
            2. Zuschneiden
          </div>
          <div className={`pb-2 px-1 ${step === "threshold" ? "border-b-2 border-primary font-medium text-primary" : ""}`}>
            3. Schwarz/Weiß
          </div>
          <div className={`pb-2 px-1 ${step === "colorize" ? "border-b-2 border-primary font-medium text-primary" : ""}`}>
            4. Einfärben
          </div>
          <div className={`pb-2 px-1 ${step === "save" ? "border-b-2 border-primary font-medium text-primary" : ""}`}>
            5. Speichern
          </div>
        </div>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {step === "upload" && (
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
            )}
            
            {step === "crop" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Zuschneiden</Label>
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={cropImage}
                      disabled={isCropped}
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Freistellen
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Verschieben und vergrößern Sie das blaue Rechteck, um den Bildausschnitt zu wählen. Klicken Sie dann auf "Freistellen".
                  </p>
                  <div className="border rounded-md p-1 flex justify-center bg-gray-50">
                    <canvas ref={canvasRef} width={500} height={500} />
                  </div>
                </div>
              </div>
            )}
            
            {step === "threshold" && (
              <div className="space-y-6">
                <div>
                  <Label>Schwarz-Weiß-Konvertierung</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Wählen Sie eine der fünf Stufen, um zu bestimmen, welche Bereiche schwarz und welche weiß werden.
                  </p>
                  {renderThresholdButtons()}
                  <div className="border rounded-md p-1 flex justify-center bg-gray-50 mt-4">
                    <canvas ref={canvasRef} width={300} height={300} />
                  </div>
                </div>
              </div>
            )}
            
            {step === "colorize" && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="icon-color">Icon-Farbe</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Wählen Sie eine Farbe für Ihr Icon aus.
                  </p>
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
                  <Label>Vorschau</Label>
                  <div className="mt-2 border rounded-md p-6 bg-gray-50 flex items-center justify-center">
                    {processedSvgContent ? (
                      <div className="w-32 h-32 flex items-center justify-center">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: processedSvgContent.replace(/fill="([^"]*)"/, `fill="${color}"`) 
                          }} 
                        />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Keine Vorschau verfügbar</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {step === "save" && (
              <div className="space-y-6">
                <div>
                  <Label>Zusammenfassung</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">{name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Farbe</p>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-sm text-muted-foreground">{color}</span>
                      </div>
                    </div>
                    {description && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium">Beschreibung</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Endgültiges Icon</Label>
                  <div className="mt-2 border rounded-md p-6 bg-gray-50 flex items-center justify-center">
                    {processedSvgContent ? (
                      <div className="w-32 h-32 flex items-center justify-center">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: processedSvgContent.replace(/fill="([^"]*)"/, `fill="${color}"`) 
                          }} 
                        />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Keine Vorschau verfügbar</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              {step !== "upload" ? (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handlePrevStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/profile")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
              )}
              
              {step !== "save" ? (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  disabled={
                    (step === "upload" && !file) ||
                    (step === "crop" && !isCropped)
                  }
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={!name || !processedSvgContent || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Icon speichern
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Icon-Editor Hilfe</DialogTitle>
            <DialogDescription>
              So erstellen Sie ein benutzerdefiniertes Icon
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium flex items-center">
                <Image className="w-4 h-4 mr-2" />
                1. Bild hochladen
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Laden Sie ein Bild hoch, das als Grundlage für Ihr Icon dienen soll.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium flex items-center">
                <Square className="w-4 h-4 mr-2" />
                2. Zuschneiden
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Positionieren und skalieren Sie das blaue Rechteck zum Ausschneiden des gewünschten Bereichs. Klicken Sie dann auf "Freistellen".
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium">3. Schwarz-Weiß-Konvertierung</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Wählen Sie eine der fünf Stufenoptionen, um zu bestimmen, welche Bereiche schwarz und welche weiß werden.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium flex items-center">
                <PaintBucket className="w-4 h-4 mr-2" />
                4. Einfärben
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Wählen Sie eine Farbe für Ihr Icon aus und sehen Sie eine Vorschau des Ergebnisses.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium flex items-center">
                <Save className="w-4 h-4 mr-2" />
                5. Speichern
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Überprüfen Sie die Einstellungen und speichern Sie Ihr neues Icon.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
