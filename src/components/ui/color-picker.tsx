
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Circle } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Expanded color options with at least 40 colors, matching the ActionForm component
const colorOptions = [
  // Default button variants
  { value: "default", label: "Blue (Default)", className: "bg-primary" },
  { value: "destructive", label: "Red", className: "bg-destructive" },
  { value: "secondary", label: "Gray", className: "bg-secondary" },
  { value: "warning", label: "Amber", className: "bg-amber-500" },
  { value: "success", label: "Green", className: "bg-green-600" },
  
  // Extended color palette - blues & teals
  { value: "cyan", label: "Cyan", className: "bg-cyan-500" },
  { value: "teal", label: "Teal", className: "bg-teal-500" },
  { value: "sky", label: "Sky Blue", className: "bg-sky-500" },
  { value: "azure", label: "Azure", className: "bg-sky-600" },
  { value: "cobalt", label: "Cobalt", className: "bg-blue-700" },
  { value: "navy", label: "Navy", className: "bg-blue-900" },
  { value: "turquoise", label: "Turquoise", className: "bg-teal-400" },
  { value: "seafoam", label: "Seafoam", className: "bg-green-300" },
  
  // Greens & yellows
  { value: "emerald", label: "Emerald", className: "bg-emerald-500" },
  { value: "lime", label: "Lime", className: "bg-lime-500" },
  { value: "yellow", label: "Yellow", className: "bg-yellow-500" },
  { value: "olive", label: "Olive", className: "bg-yellow-700" },
  { value: "forest", label: "Forest", className: "bg-green-800" },
  { value: "mint", label: "Mint", className: "bg-green-200" },
  { value: "sage", label: "Sage", className: "bg-green-200" },
  
  // Reds, oranges & browns
  { value: "orange", label: "Orange", className: "bg-orange-500" },
  { value: "coral", label: "Coral", className: "bg-orange-400" },
  { value: "maroon", label: "Maroon", className: "bg-red-800" },
  { value: "brown", label: "Brown", className: "bg-amber-800" },
  { value: "crimson", label: "Crimson", className: "bg-red-700" },
  { value: "burgundy", label: "Burgundy", className: "bg-red-900" },
  { value: "brick", label: "Brick", className: "bg-red-600" },
  { value: "sienna", label: "Sienna", className: "bg-amber-700" },
  { value: "ochre", label: "Ochre", className: "bg-yellow-600" },
  { value: "gold", label: "Gold", className: "bg-yellow-400" },
  { value: "bronze", label: "Bronze", className: "bg-amber-600" },
  
  // Purples & pinks
  { value: "purple", label: "Purple", className: "bg-purple-600" },
  { value: "violet", label: "Violet", className: "bg-violet-600" },
  { value: "indigo", label: "Indigo", className: "bg-indigo-600" },
  { value: "lavender", label: "Lavender", className: "bg-purple-300" },
  { value: "fuchsia", label: "Fuchsia", className: "bg-fuchsia-500" },
  { value: "magenta", label: "Magenta", className: "bg-pink-600" },
  { value: "rose", label: "Rose", className: "bg-rose-500" },
  { value: "pink", label: "Pink", className: "bg-pink-500" },
  { value: "plum", label: "Plum", className: "bg-purple-800" },
  { value: "mauve", label: "Mauve", className: "bg-purple-400" },
  
  // Grays
  { value: "slate", label: "Slate", className: "bg-slate-500" },
  { value: "silver", label: "Silver", className: "bg-gray-400" },
  { value: "charcoal", label: "Charcoal", className: "bg-gray-700" },
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState(value || "default");

  useEffect(() => {
    setSelectedColor(value || "default");
  }, [value]);

  const filteredColors = search 
    ? colorOptions.filter(color => 
        color.label.toLowerCase().includes(search.toLowerCase()))
    : colorOptions;

  const handleColorSelect = (colorValue: string) => {
    setSelectedColor(colorValue);
    onChange(colorValue);
  };

  // Get color display information
  const getColorInfo = (colorValue: string) => {
    const colorOption = colorOptions.find(c => c.value === colorValue);
    return {
      className: colorOption?.className || "bg-primary",
      label: colorOption?.label || "Custom Color",
    };
  };

  const selectedColorInfo = getColorInfo(selectedColor);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div 
          className={cn(
            "w-10 h-10 rounded-md border", 
            selectedColorInfo.className
          )}
          aria-label="Current color preview"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {selectedColorInfo.label}
          </p>
          <p className="text-xs text-muted-foreground">{selectedColor}</p>
        </div>
      </div>

      <Input
        placeholder="Search colors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />

      <ScrollArea className="h-[300px] rounded-md border p-2">
        <div className="grid grid-cols-8 gap-2">
          {filteredColors.map((color) => (
            <button
              key={color.value}
              type="button"
              className={cn(
                "w-6 h-6 rounded-full p-0",
                selectedColor === color.value ? "ring-2 ring-offset-2 ring-ring" : ""
              )}
              onClick={() => handleColorSelect(color.value)}
              title={color.label}
              aria-label={`Select ${color.label} color`}
            >
              <Circle className={`h-6 w-6 ${color.className}`} />
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
