
import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ActionColor } from "@/hooks/useActions";

export interface ThemedButtonProps extends ButtonProps {
  variant?: ActionColor;
}

export const ThemedButton = React.forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <Button className={className} variant={variant} ref={ref} {...props}>
        {children}
      </Button>
    );
  }
);

ThemedButton.displayName = "ThemedButton";
