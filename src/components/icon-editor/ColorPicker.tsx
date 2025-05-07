
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPreview } from "./IconPreview";

interface ColorPickerProps {
  color: string;
  setColor: (color: string) => void;
  processedSvgContent: string | null;
}

export function ColorPicker({ color, setColor, processedSvgContent }: ColorPickerProps) {
  return (
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
          <IconPreview 
            processedSvgContent={processedSvgContent}
            color={color}
          />
        </div>
      </div>
    </div>
  );
}
