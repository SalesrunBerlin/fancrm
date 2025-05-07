
import { useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIconEditor } from "@/hooks/useIconEditor";
import { ImageUploader } from "@/components/icon-editor/ImageUploader";
import { HelpDialog } from "@/components/icon-editor/HelpDialog";
import { ImageCropper } from "@/components/icon-editor/ImageCropper";
import { StepNavigation } from "@/components/icon-editor/StepNavigation";
import { ThresholdCanvas } from "@/components/icon-editor/ThresholdCanvas";
import { ColorPicker } from "@/components/icon-editor/ColorPicker";
import { IconSummary } from "@/components/icon-editor/IconSummary";
import { fabric } from "fabric";
import { generateSVGFromCanvas } from "@/utils/imageProcessing";

export default function IconEditorPage() {
  const {
    name,
    setName,
    description,
    setDescription,
    color,
    setColor,
    file,
    previewUrl,
    uploading,
    step,
    processedSvgContent,
    thresholdLevel,
    setThresholdLevel,
    showHelp,
    setShowHelp,
    isCropped,
    setIsCropped,
    canvasRef,
    handleFileDrop,
    handleFileSelect,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    navigate,
    canProceedToNext
  } = useIconEditor();

  // For fabric.js image cropping
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const imageRef = useRef<fabric.Image | null>(null);
  const rectRef = useRef<fabric.Rect | null>(null);
  
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
    // Fix: Use the setPreviewUrl from the useIconEditor hook
    setPreviewUrl(croppedDataUrl);
    setIsCropped(true);
    
    // Recreate the canvas with the cropped image
    canvas.dispose();
    fabricCanvasRef.current = null;
    
    fabric.Image.fromURL(croppedDataUrl, (newImg) => {
      // Create new canvas for the cropped image
      fabricCanvasRef.current = new fabric.Canvas(document.getElementById('crop-canvas') as HTMLCanvasElement, {
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
            )}
            
            {step === "crop" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>Zuschneiden</div>
                  <Button 
                    type="button" 
                    variant="default" 
                    size="sm"
                    onClick={cropImage}
                    disabled={isCropped}
                  >
                    <span className="h-4 w-4 mr-2">✂️</span>
                    Freistellen
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Verschieben und vergrößern Sie das blaue Rechteck, um den Bildausschnitt zu wählen. Klicken Sie dann auf "Freistellen".
                </p>
                <div className="border rounded-md p-1 flex justify-center bg-gray-50">
                  <canvas id="crop-canvas" width={500} height={500} />
                </div>
              </div>
            )}
            
            {step === "threshold" && (
              <ThresholdCanvas 
                previewUrl={previewUrl}
                thresholdLevel={thresholdLevel}
                setThresholdLevel={setThresholdLevel}
                canvasRef={canvasRef}
              />
            )}
            
            {step === "colorize" && (
              <ColorPicker
                color={color}
                setColor={setColor}
                processedSvgContent={processedSvgContent}
              />
            )}
            
            {step === "save" && (
              <IconSummary
                name={name}
                description={description}
                color={color}
                processedSvgContent={processedSvgContent}
              />
            )}
            
            <StepNavigation
              step={step}
              handlePrevStep={handlePrevStep}
              handleNextStep={handleNextStep}
              handleSubmit={handleSubmit}
              uploading={uploading}
              canProceed={canProceedToNext()}
              navigate={navigate}
            />
          </div>
        </CardContent>
      </Card>
      
      <HelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
