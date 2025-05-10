
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
import { ThemedButton } from "@/components/ui/themed-button";

interface ExpandableActionButtonProps {
  actionName: string;
  color: ActionColor;
  onExecute: () => void;
  compact?: boolean; // Add compact mode for table cells
  dropdown?: boolean; // Add dropdown mode for table rows
  actions?: Array<{ name: string; color: ActionColor; onClick: () => void }>; // Multiple actions for dropdown
  wideButton?: boolean; // New prop for wider buttons
}

export function ExpandableActionButton({ 
  actionName, 
  color, 
  onExecute,
  compact = false,
  dropdown = false,
  actions = [],
  wideButton = false
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
          <ThemedButton 
            variant="ghost"
            size="sm"
            className="h-8 p-0 text-blue-500 hover:text-blue-600"
            useUserColor={false}
          >
            <Play className="h-4 w-4" />
          </ThemedButton>
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

  // For compact mode in tables, just show a small button
  if (compact) {
    return (
      <ThemedButton 
        variant={color}
        size="sm"
        className={`h-7 p-0 ${wideButton ? "w-full min-w-[120px]" : ""} text-xs flex items-center justify-start pl-2`}
        onClick={onExecute}
        title={actionName}
        useUserColor={false}
      >
        <Play className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
        {wideButton && <span className="truncate text-left">{actionName}</span>}
      </ThemedButton>
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
        <ThemedButton 
          variant={color}
          size="icon"
          className="h-8 transition-all text-xs"
          onClick={handleButtonClick}
          title={actionName}
          useUserColor={false}
        >
          <Play className="h-4 w-4" />
        </ThemedButton>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="absolute left-12 top-0 z-20">
        <ThemedButton 
          variant={color}
          size="default"
          className="h-8 transition-all whitespace-nowrap text-xs text-left"
          onClick={handleNameClick}
          useUserColor={false}
        >
          {actionName}
        </ThemedButton>
      </CollapsibleContent>
    </Collapsible>
  );
}
