
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface TypographySectionProps {
  fontFamily: string;
  fontWeight: number;
  fontWidth: number;
  onFontFamilyChange: (value: string) => void;
  onFontWeightChange: (value: number) => void;
  onFontWidthChange: (value: number) => void;
}

const fontFamilies = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "SF Pro", label: "SF Pro" },
  { value: "Arial", label: "Arial" },
];

export function TypographySection({
  fontFamily,
  fontWeight,
  fontWidth,
  onFontFamilyChange,
  onFontWeightChange,
  onFontWidthChange
}: TypographySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography Settings</CardTitle>
        <CardDescription>
          Customize the typography of your interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="font-family">Font Family</Label>
          <Select
            value={fontFamily}
            onValueChange={onFontFamilyChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map(font => (
                <SelectItem 
                  key={font.value} 
                  value={font.value}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-weight">Font Weight</Label>
              <span className="text-sm text-muted-foreground">{fontWeight}</span>
            </div>
            <Slider
              id="font-weight"
              min={300}
              max={700}
              step={100}
              value={[fontWeight]}
              onValueChange={(values) => onFontWeightChange(values[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Light (300)</span>
              <span>Regular (400)</span>
              <span>Bold (700)</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-width">Font Width</Label>
              <span className="text-sm text-muted-foreground">{fontWidth}%</span>
            </div>
            <Slider
              id="font-width"
              min={75}
              max={125}
              step={25}
              value={[fontWidth]}
              onValueChange={(values) => onFontWidthChange(values[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Condensed (75%)</span>
              <span>Normal (100%)</span>
              <span>Extended (125%)</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-background border rounded-lg">
          <h3 className="font-semibold mb-3">Typography Preview</h3>
          <div className="space-y-4">
            <p 
              className="text-2xl" 
              style={{ 
                fontFamily, 
                fontWeight, 
                fontStretch: `${fontWidth}%`
              }}
            >
              This is a headline
            </p>
            <p 
              className="text-base" 
              style={{ 
                fontFamily, 
                fontWeight, 
                fontStretch: `${fontWidth}%`
              }}
            >
              This is a paragraph of text that demonstrates how your selected typography settings will appear in the interface. The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
