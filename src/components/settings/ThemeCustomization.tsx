
import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const fonts = [
  { value: "inter", label: "Inter", className: "font-['Inter']" },
  { value: "roboto", label: "Roboto", className: "font-['Roboto']" },
  { value: "open_sans", label: "Open Sans", className: "font-['Open_Sans']" },
  { value: "nunito", label: "Nunito", className: "font-['Nunito']" },
  { value: "lato", label: "Lato", className: "font-['Lato']" },
];

export function ThemeCustomization() {
  const { preferences, savePreferences, loading } = useColorPreferences();
  const [primaryColor, setPrimaryColor] = useState('#6B8AFE');
  const [textColor, setTextColor] = useState('#000000');
  const [font, setFont] = useState('inter');
  const [saving, setSaving] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (preferences) {
      setPrimaryColor(preferences.colors.primary);
      setTextColor(preferences.colors.text);
      setFont(preferences.colors.font);
    }
  }, [preferences]);

  // Update preview whenever values change
  useEffect(() => {
    setPreviewStyle({
      fontFamily: `${font}, sans-serif`,
      color: textColor,
    });
  }, [primaryColor, textColor, font]);

  const handleSave = async () => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      await savePreferences({
        ...preferences,
        colors: {
          primary: primaryColor,
          text: textColor,
          font: font
        }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryColor('#6B8AFE');
    setTextColor('#000000');
    setFont('inter');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading theme settings...</span>
        </CardContent>
      </Card>
    );
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
              {fonts.map((fontOption) => (
                <SelectItem 
                  key={fontOption.value} 
                  value={fontOption.value}
                  className={fontOption.className}
                >
                  <span className={fontOption.className}>{fontOption.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>Reset to Default</Button>
        </div>
        
        {/* Preview section */}
        <div className="mt-6 p-4 border rounded-md">
          <h3 className="mb-2 font-medium">Preview:</h3>
          <div className="space-y-4">
            <p style={previewStyle}>
              This text shows your selected font and text color.
            </p>
            <Button 
              style={{ 
                backgroundColor: primaryColor,
                color: '#ffffff',
              }}
              className="hover:opacity-90"
            >
              Sample Button
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
