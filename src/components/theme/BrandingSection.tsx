
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { useLogoUpload } from "@/hooks/useLogoUpload";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

interface BrandingSectionProps {
  iconPack: string;
  logoUrl: string | null;
  onIconPackChange: (value: string) => void;
  onLogoUrlChange: (value: string | null) => void;
}

const iconPacks = [
  { value: "lucide", label: "Lucide" },
  { value: "tabler", label: "Tabler" },
  { value: "custom", label: "Custom" },
];

export function BrandingSection({
  iconPack,
  logoUrl,
  onIconPackChange,
  onLogoUrlChange
}: BrandingSectionProps) {
  const { user } = useAuth();
  const { uploadLogo, isUploading } = useLogoUpload();
  const [error, setError] = useState<string | null>(null);
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!['image/svg+xml', 'image/png'].includes(file.type)) {
      setError('Please upload an SVG or PNG file');
      return;
    }
    
    // Validate file size (max 200 KB)
    if (file.size > 200 * 1024) {
      setError('File size must be less than 200 KB');
      return;
    }
    
    setError(null);
    
    try {
      const url = await uploadLogo(file);
      onLogoUrlChange(url);
    } catch (err) {
      setError('Failed to upload logo');
      console.error('Logo upload error:', err);
    }
  };
  
  const removeLogo = () => {
    onLogoUrlChange(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          Customize branding elements like icons and logo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="icon-pack">Icon Pack</Label>
          <Select
            value={iconPack}
            onValueChange={onIconPackChange}
          >
            <SelectTrigger className="w-full">
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
          
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-3">Icon Preview:</p>
            <div className="flex flex-wrap gap-4 p-4 border rounded-md">
              <Icon name="home" pack={iconPack} size="md" />
              <Icon name="user" pack={iconPack} size="md" />
              <Icon name="settings" pack={iconPack} size="md" />
              <Icon name="search" pack={iconPack} size="md" />
              <Icon name="bell" pack={iconPack} size="md" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Logo</Label>
          <p className="text-sm text-muted-foreground">
            Upload a logo for your interface (SVG or PNG, max 200KB)
          </p>
          
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <div className="w-40 h-20 border rounded-md flex items-center justify-center p-2">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={removeLogo}
                type="button"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                id="logo-upload"
                type="file"
                accept=".svg,.png"
                onChange={handleLogoUpload}
                disabled={isUploading}
              />
              
              {isUploading && (
                <div className="flex items-center text-sm text-primary">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </div>
              )}
              
              {error && (
                <p className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
