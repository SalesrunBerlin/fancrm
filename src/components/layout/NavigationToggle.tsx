
import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";

interface NavigationToggleProps {
  onToggle?: () => void;
  className?: string;
}

export function NavigationToggle({ onToggle, className }: NavigationToggleProps) {
  const handleClick = () => {
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={className}
      aria-label="Toggle navigation menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
