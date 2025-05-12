import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

interface ColorSectionProps {
  primaryColor: string;
  accentColor: string;
  onPrimaryColorChange: (color: string) => void;
  onAccentColorChange: (color: string) => void;
}

// Function to calculate contrast ratio between two colors
function calculateContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  // Calculate relative luminance
  const calculateLuminance = (color: { r: number, g: number, b: number }) => {
    const { r, g, b } = color;
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;
    
    const r_srgb = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const g_srgb = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const b_srgb = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r_srgb + 0.7152 * g_srgb + 0.0722 * b_srgb;
  };
  
  // Calculate the contrast ratio
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  const fgLuminance = calculateLuminance(fgRgb);
  const bgLuminance = calculateLuminance(bgRgb);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function ColorSection({
  primaryColor,
  accentColor,
  onPrimaryColorChange,
  onAccentColorChange
}: ColorSectionProps) {
  const [contrastRatio, setContrastRatio] = useState<number>(0);
  const [contrastWarning, setContrastWarning] = useState<boolean>(false);
  
  // Calculate contrast ratio when colors change
  useEffect(() => {
    const ratio = calculateContrastRatio(primaryColor, "#FFFFFF");
    setContrastRatio(ratio);
    setContrastWarning(ratio < 4.5);
  }, [primaryColor]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Settings</CardTitle>
        <CardDescription>
          Customize the color scheme of your interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="primary-color">Primary Color</Label>
            {contrastWarning ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <InfoIcon className="h-3 w-3" />
                Low contrast ({contrastRatio.toFixed(2)}:1)
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                Contrast: {contrastRatio.toFixed(2)}:1
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Used for buttons, links, and active states
          </p>
          <ColorPicker
            value={primaryColor}
            onChange={onPrimaryColorChange}
            colors={[
              { value: "#0ea5e9", label: "Sky Blue" },
              { value: "#2563eb", label: "Blue" },
              { value: "#6366f1", label: "Indigo" },
              { value: "#8b5cf6", label: "Purple" },
              { value: "#d946ef", label: "Magenta" },
              { value: "#f43f5e", label: "Rose" },
              { value: "#f97316", label: "Orange" },
              { value: "#eab308", label: "Yellow" },
              { value: "#84cc16", label: "Lime" },
              { value: "#10b981", label: "Emerald" },
            ]}
          />
          
          {contrastWarning && (
            <p className="text-sm text-destructive">
              For WCAG AA compliance, the contrast ratio should be at least 4.5:1.
              Consider choosing a darker primary color.
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accent-color">Accent Color</Label>
          <p className="text-sm text-muted-foreground">
            Used for highlighting and secondary actions
          </p>
          <ColorPicker
            value={accentColor}
            onChange={onAccentColorChange}
            colors={[
              { value: "#06b6d4", label: "Cyan" },
              { value: "#3b82f6", label: "Blue" },
              { value: "#8b5cf6", label: "Purple" },
              { value: "#d946ef", label: "Magenta" },
              { value: "#f43f5e", label: "Rose" },
              { value: "#f97316", label: "Orange" },
              { value: "#facc15", label: "Yellow" },
              { value: "#84cc16", label: "Lime" },
              { value: "#10b981", label: "Emerald" },
              { value: "#14b8a6", label: "Teal" },
            ]}
          />
        </div>
        
        <div className="p-4 bg-background border rounded-lg">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div 
                className="h-24 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Primary Color
              </div>
            </div>
            <div>
              <div 
                className="h-24 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: accentColor }}
              >
                Accent Color
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
