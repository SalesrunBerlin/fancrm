
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { ActionColor } from "@/hooks/useActions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExpandableActionButtonProps {
  actionName: string;
  color: ActionColor;
  onExecute: () => void;
}

export function ExpandableActionButton({ actionName, color, onExecute }: ExpandableActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleButtonClick = () => {
    // Only toggle open state when button is clicked
    setIsOpen(!isOpen);
  };

  const handleNameClick = () => {
    // When action name is clicked, execute the action
    onExecute();
    setIsOpen(false); // Close after execution
  };

  // Convert ActionColor to Button variant
  const getButtonVariant = (color: ActionColor): "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" => {
    // Map color categories to button variants
    if (color === "destructive" || color === "maroon" || color === "crimson" || color === "burgundy" || color === "brick") {
      return "destructive";
    } else if (color === "secondary" || color === "slate" || color === "silver" || color === "charcoal") {
      return "secondary";
    } else if (color === "warning" || color === "yellow" || color === "gold" || color === "orange" || color === "coral") {
      return "outline"; // Using outline for warning/yellow tones
    } else if (color === "success" || color === "emerald" || color === "lime" || color === "forest" || color === "mint" || color === "sage") {
      return "default"; // Using default (which is typically green in most themes)
    }
    
    // Default to the primary button style for all other colors
    return "default";
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="relative transition-all duration-300"
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant={getButtonVariant(color)}
          size="icon"
          className="h-8 w-8 rounded-full transition-all"
          onClick={handleButtonClick}
          title={actionName}
        >
          <PlayCircle className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="absolute left-12 top-0 z-20">
        <Button 
          variant={getButtonVariant(color)}
          size="default"
          className="h-8 transition-all whitespace-nowrap"
          onClick={handleNameClick}
        >
          {actionName}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
