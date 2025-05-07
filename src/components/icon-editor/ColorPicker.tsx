
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconVariantPreview } from "./IconVariantPreview";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  setColor: (color: string) => void;
  processedSvgContent: string | null;
}

export function ColorPicker({ color, setColor, processedSvgContent }: ColorPickerProps) {
  const [showVariants, setShowVariants] = useState(false);

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
        <div className="flex items-center justify-between mb-3">
          <Label>Vorschau</Label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowVariants(!showVariants)}
            className="text-xs"
          >
            <Palette className="w-4 h-4 mr-1" />
            {showVariants ? 'Varianten ausblenden' : 'Farbvarianten anzeigen'}
          </Button>
        </div>
        <IconVariantPreview
          processedSvgContent={processedSvgContent}
          currentColor={color}
          showVariants={showVariants}
        />
      </div>
    </div>
  );
}
