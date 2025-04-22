
import { Palette, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useColorPreferences } from "@/hooks/useColorPreferences";
import { useTheme } from "@/hooks/useTheme";

export function ColorSettings() {
  const { colors, updateColor, resetColors, savePreferences, isSaving } = useColorPreferences();
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Farbeinstellungen ({theme === 'dark' ? 'Dark' : 'Light'} Mode)</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetColors}
          >
            Zurücksetzen
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={savePreferences}
            disabled={isSaving}
          >
            {isSaving ? 'Speichern...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>
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
                onChange={(e) => updateColor(color.id, e.target.value)}
                className="w-12 h-8 p-0 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={color.value}
                onChange={(e) => updateColor(color.id, e.target.value)}
                className="flex-1 h-8 px-2 border rounded"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
