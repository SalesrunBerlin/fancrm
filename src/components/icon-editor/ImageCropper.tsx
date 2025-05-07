
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Crop } from "lucide-react";
import { fabric } from "fabric";

interface ImageCropperProps {
  previewUrl: string | null;
  isCropped: boolean;
  cropImage: () => void;
}

export function ImageCropper({ previewUrl, isCropped, cropImage }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const imageRef = useRef<fabric.Image | null>(null);
  const rectRef = useRef<fabric.Rect | null>(null);
  
  useEffect(() => {
    if (canvasRef.current && previewUrl) {
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
  }, [previewUrl]);

  return (
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
  );
}
