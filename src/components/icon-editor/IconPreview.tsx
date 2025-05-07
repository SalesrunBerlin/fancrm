
interface IconPreviewProps {
  processedSvgContent: string | null;
  color: string;
}

export function IconPreview({ processedSvgContent, color }: IconPreviewProps) {
  if (!processedSvgContent) {
    return <div className="text-muted-foreground">Keine Vorschau verfügbar</div>;
  }

  return (
    <div className="w-32 h-32 flex items-center justify-center">
      <div 
        dangerouslySetInnerHTML={{ 
          __html: processedSvgContent.replace(/fill="([^"]*)"/, `fill="${color}"`) 
        }} 
      />
    </div>
  );
}
