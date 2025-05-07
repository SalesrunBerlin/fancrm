
import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { ThresholdLevel } from "@/types/icon-editor";
import { ThresholdSelector } from "./ThresholdSelector";
import { getThresholdValue } from "@/utils/imageProcessing";

interface ThresholdCanvasProps {
  previewUrl: string | null;
  thresholdLevel: ThresholdLevel;
  setThresholdLevel: (level: ThresholdLevel) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function ThresholdCanvas({ 
  previewUrl, 
  thresholdLevel, 
  setThresholdLevel,
  canvasRef
}: ThresholdCanvasProps) {
  // Apply threshold when the component mounts or previewUrl changes
  useEffect(() => {
    if (canvasRef.current && previewUrl) {
      applyThreshold();
    }
  }, [canvasRef, previewUrl]);

  const applyThreshold = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // If we have a cropped image or original image
    if (!previewUrl) return;
    
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
      
      // Scale the canvas display for better view
      const scale = Math.min(
        300 / canvas.width,
        300 / canvas.height
      );
      canvas.style.width = `${canvas.width * scale}px`;
      canvas.style.height = `${canvas.height * scale}px`;
    };
    
    img.src = previewUrl;
  };

  // Re-apply threshold when the level changes
  useEffect(() => {
    applyThreshold();
  }, [thresholdLevel]);

  return (
    <div className="space-y-6">
      <div>
        <Label>Schwarz-Weiß-Konvertierung</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Wählen Sie eine der fünf Stufen, um zu bestimmen, welche Bereiche schwarz und welche weiß werden.
        </p>
        <ThresholdSelector 
          thresholdLevel={thresholdLevel} 
          setThresholdLevel={setThresholdLevel} 
        />
        <div className="border rounded-md p-1 flex justify-center bg-gray-50 mt-4">
          <canvas ref={canvasRef} width={300} height={300} />
        </div>
      </div>
    </div>
  );
}
