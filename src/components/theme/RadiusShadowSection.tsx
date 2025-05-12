
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface RadiusShadowSectionProps {
  radiusScale: string;
  shadowLevel: string;
  onRadiusScaleChange: (value: string) => void;
  onShadowLevelChange: (value: string) => void;
}

const radiusOptions = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "full", label: "Full" },
];

const shadowOptions = [
  { value: "none", label: "None" },
  { value: "sm", label: "Light" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Heavy" },
  { value: "xl", label: "Extra" },
];

export function RadiusShadowSection({
  radiusScale,
  shadowLevel,
  onRadiusScaleChange,
  onShadowLevelChange
}: RadiusShadowSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interface Geometry</CardTitle>
        <CardDescription>
          Customize the corners and shadows of interface elements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="radius-scale">Border Radius</Label>
          <ToggleGroup 
            type="single" 
            value={radiusScale} 
            onValueChange={(value) => {
              if (value) onRadiusScaleChange(value);
            }}
            className="justify-start"
          >
            {radiusOptions.map(option => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="shadow-level">Shadow Depth</Label>
          <ToggleGroup 
            type="single" 
            value={shadowLevel} 
            onValueChange={(value) => {
              if (value) onShadowLevelChange(value);
            }}
            className="justify-start"
          >
            {shadowOptions.map(option => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        
        <div className="pt-4">
          <div className="grid grid-cols-2 gap-6">
            {radiusOptions.map((radius) => (
              <div key={radius.value} className="space-y-2">
                <div 
                  className={`h-20 w-full border-2 bg-background shadow-${shadowLevel}`}
                  style={{ 
                    borderRadius: radius.value === "none" ? 0 : 
                              radius.value === "sm" ? "4px" : 
                              radius.value === "md" ? "6px" : 
                              radius.value === "lg" ? "8px" : 
                              "9999px" 
                  }}
                ></div>
                <p className="text-xs text-center text-muted-foreground">{radius.label}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
