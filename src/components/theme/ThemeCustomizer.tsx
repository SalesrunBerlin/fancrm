
import React, { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

const fontFamilies = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "SF Pro", label: "SF Pro" },
  { value: "Arial", label: "Arial" },
];

const fontWeights = [
  { value: 300, label: "Light" },
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
];

const fontWidths = [
  { value: 75, label: "Condensed" },
  { value: 100, label: "Normal" },
  { value: 125, label: "Extended" },
];

const radiusScales = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "full", label: "Full" },
];

const shadowLevels = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const densityOptions = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
];

const iconPacks = [
  { value: "lucide", label: "Lucide" },
  { value: "tabler", label: "Tabler" },
  { value: "custom", label: "Custom" },
];

export function ThemeCustomizer() {
  const { profileTheme, updateProfileTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("colors");
  
  // Create local state for theme customization
  const [themeSettings, setThemeSettings] = useState({
    primary_color: profileTheme?.primary_color || "#2563eb",
    accent_color: profileTheme?.accent_color || "#f97316",
    font_family: profileTheme?.font_family || "Inter",
    font_weight: profileTheme?.font_weight || 400,
    font_width: profileTheme?.font_width || 100,
    radius_scale: profileTheme?.radius_scale || "md",
    shadow_level: profileTheme?.shadow_level || "sm",
    density: profileTheme?.density || "comfortable",
    icon_pack: profileTheme?.icon_pack || "lucide",
  });
  
  const handleChange = (field: string, value: string | number) => {
    setThemeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      await updateProfileTheme(themeSettings);
      toast.success("Theme updated successfully");
    } catch (error) {
      toast.error("Failed to update theme");
      console.error("Error saving theme:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!profileTheme) {
    return <div className="text-center py-6">Loading theme settings...</div>;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="colors" className="flex-1">Colors</TabsTrigger>
            <TabsTrigger value="typography" className="flex-1">Typography</TabsTrigger>
            <TabsTrigger value="interface" className="flex-1">Interface</TabsTrigger>
            <TabsTrigger value="icons" className="flex-1">Icons</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <ColorPicker
                value={themeSettings.primary_color}
                onChange={(color) => handleChange('primary_color', color)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="accent-color">Accent Color</Label>
              <ColorPicker
                value={themeSettings.accent_color}
                onChange={(color) => handleChange('accent_color', color)}
                className="mt-2"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="typography" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="font-family">Font Family</Label>
              <Select
                value={themeSettings.font_family}
                onValueChange={(value) => handleChange('font_family', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select font family" />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="font-weight">Font Weight</Label>
              <Select
                value={themeSettings.font_weight.toString()}
                onValueChange={(value) => handleChange('font_weight', parseInt(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select font weight" />
                </SelectTrigger>
                <SelectContent>
                  {fontWeights.map(weight => (
                    <SelectItem key={weight.value} value={weight.value.toString()}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="font-width">Font Width</Label>
              <Select
                value={themeSettings.font_width.toString()}
                onValueChange={(value) => handleChange('font_width', parseInt(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select font width" />
                </SelectTrigger>
                <SelectContent>
                  {fontWidths.map(width => (
                    <SelectItem key={width.value} value={width.value.toString()}>
                      {width.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="interface" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="radius-scale">Border Radius</Label>
              <Select
                value={themeSettings.radius_scale}
                onValueChange={(value) => handleChange('radius_scale', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select border radius" />
                </SelectTrigger>
                <SelectContent>
                  {radiusScales.map(radius => (
                    <SelectItem key={radius.value} value={radius.value}>
                      {radius.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="shadow-level">Shadow Level</Label>
              <Select
                value={themeSettings.shadow_level}
                onValueChange={(value) => handleChange('shadow_level', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select shadow level" />
                </SelectTrigger>
                <SelectContent>
                  {shadowLevels.map(shadow => (
                    <SelectItem key={shadow.value} value={shadow.value}>
                      {shadow.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="density">UI Density</Label>
              <Select
                value={themeSettings.density}
                onValueChange={(value) => handleChange('density', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select UI density" />
                </SelectTrigger>
                <SelectContent>
                  {densityOptions.map(density => (
                    <SelectItem key={density.value} value={density.value}>
                      {density.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="icons" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="icon-pack">Icon Pack</Label>
              <Select
                value={themeSettings.icon_pack}
                onValueChange={(value) => handleChange('icon_pack', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select icon pack" />
                </SelectTrigger>
                <SelectContent>
                  {iconPacks.map(pack => (
                    <SelectItem key={pack.value} value={pack.value}>
                      {pack.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {themeSettings.icon_pack === "custom" && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Custom icons can be uploaded in the Icons section of your profile page.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveTheme} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Theme
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
