
interface IconPreviewProps {
  processedSvgContent: string | null;
  color: string;
  size?: "sm" | "md" | "lg";
}

export function IconPreview({ processedSvgContent, color, size = "md" }: IconPreviewProps) {
  if (!processedSvgContent) {
    return <div className="text-muted-foreground">Keine Vorschau verfügbar</div>;
  }

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32"
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div 
        dangerouslySetInnerHTML={{ 
          __html: processedSvgContent.replace(/fill="([^"]*)"/, `fill="${color}"`) 
        }} 
      />
    </div>
  );
}
