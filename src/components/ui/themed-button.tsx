import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ActionColor } from "@/hooks/useActions";
import { useAuth } from "@/contexts/AuthContext";

export interface ThemedButtonProps extends ButtonProps {
  variant?: ActionColor | "outline" | "ghost" | "link" | "destructive";
  useUserColor?: boolean;
}

export const ThemedButton = React.forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant, useUserColor = true, children, ...props }, ref) => {
    const { favoriteColor } = useAuth();
    
    // If useUserColor is true and no variant is provided, use the user's favorite color
    // Otherwise, use the provided variant or fall back to "default"
    const buttonVariant = (useUserColor && !variant && favoriteColor) 
      ? (favoriteColor as ActionColor) || "default" 
      : variant || "default";
    
    return (
      <Button className={className} variant={buttonVariant} ref={ref} {...props}>
        {children}
      </Button>
    );
  }
);

ThemedButton.displayName = "ThemedButton";
