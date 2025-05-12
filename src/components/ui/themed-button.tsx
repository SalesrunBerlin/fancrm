
import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ActionColor } from "@/hooks/useActions";

export interface ThemedButtonProps extends ButtonProps {
  variant?: ActionColor | "outline" | "ghost" | "link" | "destructive" | "orange";
  useUserColor?: boolean;
}

export const ThemedButton = React.forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant, useUserColor = true, children, ...props }, ref) => {
    // ThemedButton now just wraps the underlying Button component
    return (
      <Button 
        className={className} 
        variant={variant as any} 
        useUserColor={useUserColor} 
        ref={ref} 
        {...props}
      >
        {children}
      </Button>
    );
  }
);

ThemedButton.displayName = "ThemedButton";
