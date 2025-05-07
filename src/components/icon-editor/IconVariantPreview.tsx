
import { cn } from "@/lib/utils";
import { IconPreview } from "./IconPreview";

interface IconVariantPreviewProps {
  processedSvgContent: string | null;
  currentColor: string;
  showVariants?: boolean;
  className?: string;
}

const COLOR_VARIANTS = [
  { name: "Primary", value: "#9b87f5" },
  { name: "Destructive", value: "#ea384c" },
  { name: "Success", value: "#10b981" },
  { name: "Warning", value: "#f59e0b" },
  { name: "Dark", value: "#1A1F2C" },
  { name: "Light", value: "#f3f4f6" },
  { name: "Bright", value: "#0ea5e9" },
  { name: "Muted", value: "#8E9196" },
];

export function IconVariantPreview({ 
  processedSvgContent, 
  currentColor, 
  showVariants = true, 
  className 
}: IconVariantPreviewProps) {
  if (!processedSvgContent) {
    return <div className="text-muted-foreground">Keine Vorschau verfügbar</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Color Preview */}
      <div className="flex flex-col items-center">
        <div className="mb-1 text-sm font-medium">Aktuelle Farbe</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentColor }}></div>
          <span className="text-xs text-muted-foreground">{currentColor}</span>
        </div>
        <div className="mt-3 p-4 border rounded-md bg-gray-50 flex items-center justify-center">
          <IconPreview 
            processedSvgContent={processedSvgContent}
            color={currentColor}
          />
        </div>
      </div>

      {/* Color Variants */}
      {showVariants && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Farbvarianten</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COLOR_VARIANTS.map((variant) => (
              <div key={variant.value} className="flex flex-col items-center">
                <div className="text-xs mb-1">{variant.name}</div>
                <div className="p-2 border rounded-md bg-gray-50 flex items-center justify-center">
                  <IconPreview 
                    processedSvgContent={processedSvgContent}
                    color={variant.value}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
