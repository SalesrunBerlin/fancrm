
import React, { useState } from 'react';
import { Play } from "lucide-react";
import { ActionColor } from "@/hooks/useActions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExpandableActionButtonProps {
  actionName: string;
  color: ActionColor;
  onExecute: () => void;
  compact?: boolean; // Add compact mode for table cells
  dropdown?: boolean; // Add dropdown mode for table rows
  actions?: Array<{ name: string; color: ActionColor; onClick: () => void }>;
  dashboard?: boolean; // New prop for dashboard display with text
}

export function ExpandableActionButton({ 
  actionName, 
  color, 
  onExecute,
  compact = false,
  dropdown = false,
  actions = [],
  dashboard = false
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

  // For dropdown mode in tables (showing multiple actions in a dropdown)
  if (dropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost"
            size="sm"
            className="h-8 p-0 text-blue-500 hover:text-blue-600"
            useUserColor={false}
          >
            <Play className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          {actions.map((action, index) => (
            <DropdownMenuItem 
              key={index}
              onClick={action.onClick}
              className="cursor-pointer"
            >
              {action.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // New dashboard mode with icon and text
  if (dashboard) {
    return (
      <Button 
        variant={color}
        size="sm"
        className="h-8 text-left flex items-center justify-start"
        onClick={onExecute}
        title={actionName}
        useUserColor={false}
        icon={<Play className="h-3.5 w-3.5" />}
      >
        {actionName}
      </Button>
    );
  }

  // For compact mode in tables, just show a small button
  if (compact) {
    return (
      <Button 
        variant={color}
        size="sm"
        className="h-7 p-0"
        onClick={onExecute}
        title={actionName}
        useUserColor={false}
        iconOnly
        icon={<Play className="h-3.5 w-3.5" />}
      />
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
          className="h-8 transition-all"
          onClick={handleButtonClick}
          title={actionName}
          useUserColor={false}
          iconOnly
          icon={<Play />}
        />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="absolute left-12 top-0 z-20">
        <Button 
          variant={color}
          size="md"
          className="h-8 transition-all whitespace-nowrap"
          onClick={handleNameClick}
          useUserColor={false}
        >
          {actionName}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
