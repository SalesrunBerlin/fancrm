
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
  const [canExecute, setCanExecute] = useState(false);

  const handleClick = () => {
    if (canExecute) {
      onExecute();
      setCanExecute(false);
      setIsOpen(false); // Close after execution
    } else {
      setIsOpen(!isOpen);
      setCanExecute(true);
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
          variant={color}
          size="icon"
          className="h-8 w-8 rounded-full transition-all"
          onClick={() => {
            // Only toggle initially - first click just expands
            if (!isOpen) {
              setIsOpen(true);
              setCanExecute(false);
            }
          }}
        >
          <PlayCircle className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="absolute left-0 top-0 z-10">
        <Button 
          variant={color}
          size="default"
          className="h-8 transition-all"
          onClick={handleClick}
        >
          <PlayCircle className="mr-1.5 h-4 w-4" />
          {actionName}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
