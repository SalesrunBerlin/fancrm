
import { useState } from "react";
import { useColorPreferences } from "@/hooks/useColorPreferences";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fonts = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "open_sans", label: "Open Sans" },
  { value: "nunito", label: "Nunito" },
  { value: "lato", label: "Lato" },
];

export function ThemeCustomization() {
  const { preferences, savePreferences, loading } = useColorPreferences();
  const [primaryColor, setPrimaryColor] = useState(preferences?.colors.primary || '#6B8AFE');
  const [textColor, setTextColor] = useState(preferences?.colors.text || '#000000');
  const [font, setFont] = useState(preferences?.colors.font || 'inter');

  const handleSave = () => {
    if (preferences) {
      savePreferences({
        ...preferences,
        colors: {
          primary: primaryColor,
          text: textColor,
          font: font
        }
      });
    }
  };

  const handleReset = () => {
    setPrimaryColor('#6B8AFE');
    setTextColor('#000000');
    setFont('inter');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#6B8AFE"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-color">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="text-color"
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input 
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-family">Font Family</Label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger>
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" onClick={handleReset}>Reset to Default</Button>
        </div>
      </CardContent>
    </Card>
  );
}
