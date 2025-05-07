
import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EditorStep, ThresholdLevel } from "@/types/icon-editor";
import { generateSVGFromCanvas, getThresholdValue } from "@/utils/imageProcessing";

export function useIconEditor() {
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
  
  // Canvas reference for threshold
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Apply threshold when the threshold level changes
  useEffect(() => {
    if (step === "threshold") {
      applyThreshold();
    }
  }, [thresholdLevel, step]);
  
  const cropImage = () => {
    // Using the ImageCropper component's cropImage function
    // which will be called from parent
    setIsCropped(true);
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
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
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

  const canProceedToNext = () => {
    switch (step) {
      case "upload":
        return !!file;
      case "crop":
        return isCropped;
      case "save":
        return !!name && !!processedSvgContent && !uploading;
      default:
        return true;
    }
  };
  
  return {
    name,
    setName,
    description,
    setDescription,
    color,
    setColor,
    file,
    setFile,
    previewUrl,
    setPreviewUrl,
    uploading,
    step,
    svgContent,
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
    cropImage,
    navigate,
    canProceedToNext
  };
}
