
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
    switch(color) {
      case "red": return "destructive";
      case "green": return "default";
      case "blue": return "default";
      case "yellow": return "outline";
      case "purple": return "secondary";
      case "pink": return "secondary";
      case "indigo": return "default";
      case "orange": return "outline";
      case "gray": return "outline";
      default: return "default";
    }
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
