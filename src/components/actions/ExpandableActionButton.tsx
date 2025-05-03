
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { ActionColor } from "@/hooks/useActions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExpandableActionButtonProps {
  actionName: string;
  color: ActionColor;
  onExecute: () => void;
  compact?: boolean; // Add compact mode for table cells
}

export function ExpandableActionButton({ 
  actionName, 
  color, 
  onExecute,
  compact = false
}: ExpandableActionButtonProps) {
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

  // For compact mode in tables, just show a small button
  if (compact) {
    return (
      <Button 
        variant={color}
        size="sm"
        className="h-7 w-7 p-0 rounded-full"
        onClick={onExecute}
        title={actionName}
      >
        <PlayCircle className="h-3.5 w-3.5" />
      </Button>
    );
  }

  // Regular expandable button for normal view
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
          title={actionName}
        >
          <PlayCircle className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="absolute left-12 top-0 z-20">
        <Button 
          variant={color}
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
