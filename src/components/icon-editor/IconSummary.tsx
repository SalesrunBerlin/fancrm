
import { IconPreview } from "./IconPreview";

interface IconSummaryProps {
  name: string;
  description: string;
  color: string;
  processedSvgContent: string | null;
}

export function IconSummary({ name, description, color, processedSvgContent }: IconSummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium">Zusammenfassung</p>
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
        <p className="text-sm font-medium">Endgültiges Icon</p>
        <div className="mt-2 border rounded-md p-6 bg-gray-50 flex items-center justify-center">
          <IconPreview 
            processedSvgContent={processedSvgContent}
            color={color}
          />
        </div>
      </div>
    </div>
  );
}
