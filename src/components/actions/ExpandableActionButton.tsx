
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
    // Toggle open state when button is clicked
    if (!isOpen) {
      setIsOpen(true);
    } else {
      // If already open, execute the action
      onExecute();
      setIsOpen(false); // Close after execution
    }
  };

  const handleNameClick = () => {
    // When action name is clicked, execute the action
    onExecute();
    setIsOpen(false); // Close after execution
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="relative transition-all duration-300"
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant={color}
          size="icon"
          className="h-8 w-8 rounded-full transition-all"
          onClick={handleButtonClick}
        >
          <PlayCircle className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="absolute left-10 top-0 z-10">
        {/* Action name in a separate clickable element that doesn't overlap with the button */}
        <Button 
          variant={color}
          size="default"
          className="h-8 transition-all"
          onClick={handleNameClick}
        >
          {actionName}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
