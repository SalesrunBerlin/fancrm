
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DensitySectionProps {
  density: string;
  onDensityChange: (value: string) => void;
}

export function DensitySection({
  density,
  onDensityChange
}: DensitySectionProps) {
  const isCompact = density === "compact";
  
  const handleCompactToggle = (checked: boolean) => {
    onDensityChange(checked ? "compact" : "comfortable");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interface Density</CardTitle>
        <CardDescription>
          Adjust the spacing and density of interface elements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="compact-mode">Compact Mode</Label>
            <p className="text-sm text-muted-foreground">
              Reduce spacing between elements for a denser interface
            </p>
          </div>
          <Switch
            id="compact-mode"
            checked={isCompact}
            onCheckedChange={handleCompactToggle}
          />
        </div>
        
        <div className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="border rounded-md p-4 bg-background">
                <h4 className="font-medium mb-2">Comfortable</h4>
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded-sm"></div>
                  <div className="h-10 bg-muted rounded-sm"></div>
                  <div className="h-10 bg-muted rounded-sm"></div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">Standard spacing</p>
            </div>
            
            <div className="space-y-2">
              <div className="border rounded-md p-4 bg-background">
                <h4 className="font-medium mb-2">Compact</h4>
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded-sm"></div>
                  <div className="h-8 bg-muted rounded-sm"></div>
                  <div className="h-8 bg-muted rounded-sm"></div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">Reduced spacing</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
