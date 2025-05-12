
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useForm, Controller } from "react-hook-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ColorSection } from "@/components/theme/ColorSection";
import { TypographySection } from "@/components/theme/TypographySection";
import { RadiusShadowSection } from "@/components/theme/RadiusShadowSection";
import { DensitySection } from "@/components/theme/DensitySection";
import { BrandingSection } from "@/components/theme/BrandingSection";
import { debounce } from "lodash";

// Define the form values type based on the theme profile
interface ThemeFormValues {
  primary_color: string;
  accent_color: string;
  font_family: string;
  font_weight: number;
  font_width: number;
  radius_scale: string;
  shadow_level: string;
  density: string;
  icon_pack: string;
  logo_url: string | null;
}

export default function AppearanceSettingsPage() {
  const { profileTheme, updateProfileTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("colors");
  
  const form = useForm<ThemeFormValues>({
    defaultValues: {
      primary_color: profileTheme?.primary_color || "#2563eb",
      accent_color: profileTheme?.accent_color || "#f97316",
      font_family: profileTheme?.font_family || "Inter",
      font_weight: profileTheme?.font_weight || 400,
      font_width: profileTheme?.font_width || 100,
      radius_scale: profileTheme?.radius_scale || "md",
      shadow_level: profileTheme?.shadow_level || "sm",
      density: profileTheme?.density || "comfortable",
      icon_pack: profileTheme?.icon_pack || "lucide",
      logo_url: profileTheme?.logo_url || null,
    }
  });
  
  const { control, handleSubmit, watch } = form;
  
  // Set up live preview with debounced updates
  const debouncedThemeUpdate = debounce(async (values: Partial<ThemeFormValues>) => {
    try {
      // Only update the theme variables without saving to database
      if (updateProfileTheme) {
        await updateProfileTheme(values);
      }
    } catch (error) {
      console.error("Error updating theme preview:", error);
    }
  }, 300);
  
  // Watch form fields for live preview
  const formValues = watch();
  
  // Update theme preview when form values change
  useState(() => {
    debouncedThemeUpdate(formValues);
    
    // Cleanup debounce on unmount
    return () => {
      debouncedThemeUpdate.cancel();
    };
  });
  
  // Save theme changes to database
  const onSubmit = async (data: ThemeFormValues) => {
    setIsSaving(true);
    try {
      await updateProfileTheme(data);
      toast.success("Theme settings saved successfully");
    } catch (error) {
      toast.error("Failed to save theme settings");
      console.error("Error saving theme:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!profileTheme) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <PageHeader 
        title="Appearance Settings" 
        description="Customize the look and feel of your interface" 
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="colors" className="flex-1">Colors</TabsTrigger>
            <TabsTrigger value="typography" className="flex-1">Typography</TabsTrigger>
            <TabsTrigger value="interface" className="flex-1">Interface</TabsTrigger>
            <TabsTrigger value="branding" className="flex-1">Branding</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-6">
            <Controller
              name="primary_color"
              control={control}
              render={({ field }) => (
                <ColorSection 
                  primaryColor={field.value}
                  accentColor={watch("accent_color")}
                  onPrimaryColorChange={field.onChange}
                  onAccentColorChange={(value) => form.setValue("accent_color", value)}
                />
              )}
            />
          </TabsContent>
          
          <TabsContent value="typography" className="space-y-6">
            <Controller
              name="font_family"
              control={control}
              render={({ field: fontFamilyField }) => (
                <Controller
                  name="font_weight"
                  control={control}
                  render={({ field: fontWeightField }) => (
                    <Controller
                      name="font_width"
                      control={control}
                      render={({ field: fontWidthField }) => (
                        <TypographySection
                          fontFamily={fontFamilyField.value}
                          fontWeight={fontWeightField.value}
                          fontWidth={fontWidthField.value}
                          onFontFamilyChange={fontFamilyField.onChange}
                          onFontWeightChange={fontWeightField.onChange}
                          onFontWidthChange={fontWidthField.onChange}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
          </TabsContent>
          
          <TabsContent value="interface" className="space-y-6">
            <Controller
              name="radius_scale"
              control={control}
              render={({ field: radiusField }) => (
                <Controller
                  name="shadow_level"
                  control={control}
                  render={({ field: shadowField }) => (
                    <RadiusShadowSection
                      radiusScale={radiusField.value}
                      shadowLevel={shadowField.value}
                      onRadiusScaleChange={radiusField.onChange}
                      onShadowLevelChange={shadowField.onChange}
                    />
                  )}
                />
              )}
            />
            
            <Controller
              name="density"
              control={control}
              render={({ field }) => (
                <DensitySection
                  density={field.value}
                  onDensityChange={field.onChange}
                />
              )}
            />
          </TabsContent>
          
          <TabsContent value="branding" className="space-y-6">
            <Controller
              name="icon_pack"
              control={control}
              render={({ field: iconPackField }) => (
                <Controller
                  name="logo_url"
                  control={control}
                  render={({ field: logoUrlField }) => (
                    <BrandingSection
                      iconPack={iconPackField.value}
                      logoUrl={logoUrlField.value}
                      onIconPackChange={iconPackField.onChange}
                      onLogoUrlChange={logoUrlField.onChange}
                    />
                  )}
                />
              )}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
