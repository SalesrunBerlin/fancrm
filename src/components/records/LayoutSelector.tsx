
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectLayout, useObjectLayouts } from "@/hooks/useObjectLayouts";
import { Check, Layout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutSelectorProps {
  objectTypeId: string;
  selectedLayoutId?: string;
  onLayoutChange: (layoutId: string) => void;
  compact?: boolean; // New prop for compact/icon mode
}

export function LayoutSelector({ 
  objectTypeId, 
  selectedLayoutId, 
  onLayoutChange,
  compact = false
}: LayoutSelectorProps) {
  const { layouts, isLoading, getDefaultLayout } = useObjectLayouts(objectTypeId);

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
        Loading layouts...
      </div>
    );
  }

  if (!layouts || layouts.length === 0) {
    return null;
  }

  // If no layout is selected and we have layouts, use the default
  const activeLayoutId = selectedLayoutId || getDefaultLayout()?.id || layouts[0].id;

  // Find the active layout details
  const activeLayout = layouts.find(l => l.id === activeLayoutId);

  // Compact mode - just show the icon button
  if (compact) {
    return (
      <Select value={activeLayoutId} onValueChange={onLayoutChange}>
        <SelectTrigger className="w-10 h-8 p-0">
          <div className="flex items-center justify-center">
            <Layout className="w-4 h-4" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {layouts.map((layout) => (
            <SelectItem key={layout.id} value={layout.id} className="flex items-center">
              <span className="flex items-center">
                {layout.name}
                {layout.is_default && (
                  <Check className="ml-2 h-3 w-3 text-green-500" />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Regular mode with full width selector and text
  return (
    <Select value={activeLayoutId} onValueChange={onLayoutChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center">
          <Layout className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Select layout" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {layouts.map((layout) => (
          <SelectItem key={layout.id} value={layout.id} className="flex items-center">
            <span className="flex items-center">
              {layout.name}
              {layout.is_default && (
                <Check className="ml-2 h-3 w-3 text-green-500" />
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
