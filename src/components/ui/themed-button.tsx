
import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
  
  const getColorClass = () => {
    const color = colorOverride || favoriteColor;
    if (!color || color === "default") return "";
    
    // Only apply custom color to default variant
    if (variant !== "default") return "";
    
    // Check if the color is a direct variant from the button component
    if (color.match(/^[a-z]+$/)) {
      return "";  // Let the button component handle its own variants
    }
    
    // For Tailwind classes like "bg-blue-500"
    const match = color.match(/bg-([a-z]+)-\d+/);
    if (match) {
      const colorName = match[1];
      return `bg-${colorName}-500 hover:bg-${colorName}-600 text-white`;
    }
    
    return "";
  };
  
  return (
    <Button 
      className={cn(getColorClass(), className)} 
      variant={colorOverride || favoriteColor || variant}
      {...props}
    >
      {children}
    </Button>
  );
}
