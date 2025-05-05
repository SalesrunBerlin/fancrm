import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Define valid button variants to match the types in button.tsx
type ButtonVariant = 
  | "default" | "destructive" | "outline" | "secondary" | "ghost" 
  | "link" | "warning" | "success" | "icon"
  | "cyan" | "teal" | "sky" | "azure" | "cobalt" | "navy" | "turquoise" | "seafoam"
  | "emerald" | "lime" | "yellow" | "olive" | "forest" | "mint" | "sage"
  | "orange" | "coral" | "maroon" | "brown" | "crimson" | "burgundy" | "brick"
  | "sienna" | "ochre" | "gold" | "bronze"
  | "purple" | "violet" | "indigo" | "lavender" | "fuchsia" | "magenta" 
  | "rose" | "pink" | "plum" | "mauve"
  | "slate" | "silver" | "charcoal";

export interface ThemedButtonProps extends ButtonProps {
  colorOverride?: string;
}

export function ThemedButton({ 
  className, 
  variant = "default", 
  colorOverride,
  children,
  ...props 
}: ThemedButtonProps) {
  const { favoriteColor } = useAuth();
  
  // The main issue is here - we need to properly apply the favorite color as the variant
  const computedVariant = () => {
    // If a specific variant other than default is requested, honor that request
    if (variant !== "default") {
      return variant;
    }
    
    // If there's a color override, use it
    if (colorOverride) {
      return colorOverride as ButtonVariant;
    }
    
    // Otherwise, use the user's favorite color if available
    if (favoriteColor && favoriteColor !== "default") {
      return favoriteColor as ButtonVariant;
    }
    
    // Default fallback
    return "default";
  };
  
  return (
    <Button 
      className={className} 
      variant={computedVariant()}
      {...props}
    >
      {children}
    </Button>
  );
}
