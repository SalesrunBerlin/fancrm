
import React from 'react';
import { Play } from "lucide-react";
import { ActionColor } from "@/hooks/useActions";
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
  dropdown?: boolean; // Add dropdown mode for table rows
  actions?: Array<{ name: string; color: ActionColor; onClick: () => void }>; // Multiple actions for dropdown
}

export function ExpandableActionButton({ 
  actionName, 
  color, 
  onExecute,
  dropdown = false,
  actions = []
}: ExpandableActionButtonProps) {
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

  // Standard button that shows both icon and text
  return (
    <ThemedButton 
      variant={color}
      size="default"
      className="min-w-[120px] h-10"
      onClick={onExecute}
      title={actionName}
      useUserColor={false}
    >
      <Play className="h-4 w-4" />
      <span>{actionName}</span>
    </ThemedButton>
  );
}
