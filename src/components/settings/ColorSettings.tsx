
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColorSetting {
  id: string;
  label: string;
  value: string;
  cssVariable: string;
}

const defaultColors: ColorSetting[] = [
  { id: "primary", label: "Primärfarbe", value: "#6B8AFE", cssVariable: "--primary" },
  { id: "secondary", label: "Sekundärfarbe", value: "#E5EDFF", cssVariable: "--secondary" },
  { id: "background", label: "Hintergrund", value: "#FFFFFF", cssVariable: "--background" },
  { id: "foreground", label: "Text", value: "#000000", cssVariable: "--foreground" },
  { id: "muted", label: "Abgeschwächt", value: "#F0F4FF", cssVariable: "--muted" },
  { id: "accent", label: "Akzent", value: "#E5EDFF", cssVariable: "--accent" },
];

export function ColorSettings() {
  const [colors, setColors] = useState<ColorSetting[]>(defaultColors);

  const handleColorChange = (id: string, newValue: string) => {
    setColors(prevColors =>
      prevColors.map(color => {
        if (color.id === id) {
          // Update CSS variable
          document.documentElement.style.setProperty(`${color.cssVariable}`, newValue);
          return { ...color, value: newValue };
        }
        return color;
      })
    );
  };

  const resetColors = () => {
    defaultColors.forEach(color => {
      document.documentElement.style.setProperty(`${color.cssVariable}`, color.value);
    });
    setColors(defaultColors);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Farbeinstellungen</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetColors}
        >
          Zurücksetzen
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colors.map((color) => (
          <div key={color.id} className="space-y-2">
            <Label htmlFor={color.id}>{color.label}</Label>
            <div className="flex items-center gap-2">
              <input
                id={color.id}
                type="color"
                value={color.value}
                onChange={(e) => handleColorChange(color.id, e.target.value)}
                className="w-12 h-8 p-0 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={color.value}
                onChange={(e) => handleColorChange(color.id, e.target.value)}
                className="flex-1 h-8 px-2 border rounded"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
