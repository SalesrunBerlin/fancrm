
import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  pack?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
}

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
};

export function Icon({ 
  name, 
  pack, 
  size = "md", 
  color,
  className,
  ...props 
}: IconProps) {
  const { profileTheme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const iconPack = pack || profileTheme?.icon_pack || "lucide";
  
  useEffect(() => {
    async function loadIcon() {
      if (!name) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Path to icon based on pack
        let iconPath = '';
        
        // For custom user icons
        if (iconPack === 'custom' && profileTheme?.profile_id) {
          iconPath = `/icons/custom/${profileTheme.profile_id}/${name}.svg`;
        } 
        // For standard icon packs
        else {
          iconPath = `/icons/${iconPack}/${name}.svg`;
        }
        
        const response = await fetch(iconPath);
        
        if (!response.ok) {
          throw new Error(`Failed to load icon: ${response.statusText}`);
        }
        
        const svgContent = await response.text();
        setSvg(svgContent);
      } catch (err) {
        console.error("Error loading icon:", err);
        setError(err instanceof Error ? err.message : "Failed to load icon");
        setSvg(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadIcon();
  }, [name, iconPack, profileTheme?.profile_id]);
  
  const sizeClass = iconSizes[size];
  
  if (isLoading) {
    return (
      <span className={cn("inline-flex items-center justify-center", sizeClass, className)} {...props}>
        <Loader2 className="animate-spin" style={{ color: color || 'currentColor' }} />
      </span>
    );
  }
  
  if (error || !svg) {
    return (
      <span className={cn("inline-flex items-center justify-center bg-muted/30 rounded", sizeClass, className)} {...props}>
        <span className="text-xs text-muted-foreground">?</span>
      </span>
    );
  }
  
  return (
    <span 
      className={cn("inline-flex items-center justify-center", sizeClass, className)} 
      dangerouslySetInnerHTML={{ 
        __html: color 
          ? svg.replace(/fill="([^"]*)"/, `fill="${color}"`) 
          : svg 
      }}
      {...props}
    />
  );
}
