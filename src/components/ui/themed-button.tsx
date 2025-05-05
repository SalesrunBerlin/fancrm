
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
    
    // Extract the color name from the class (e.g., "bg-blue-500" -> "blue")
    const match = color.match(/bg-([a-z]+)-\d+/);
    if (!match) return "";
    
    const colorName = match[1];
    return `bg-${colorName}-500 hover:bg-${colorName}-600 text-white`;
  };
  
  return (
    <Button 
      className={cn(getColorClass(), className)} 
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  );
}
