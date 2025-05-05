
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const TAILWIND_COLORS = [
  // Primary colors
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Lime", value: "bg-lime-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Sky", value: "bg-sky-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Violet", value: "bg-violet-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Fuchsia", value: "bg-fuchsia-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Rose", value: "bg-rose-500" },

  // Lighter shades
  { name: "Red 300", value: "bg-red-300" },
  { name: "Orange 300", value: "bg-orange-300" },
  { name: "Amber 300", value: "bg-amber-300" },
  { name: "Yellow 300", value: "bg-yellow-300" },
  { name: "Lime 300", value: "bg-lime-300" },
  { name: "Green 300", value: "bg-green-300" },
  { name: "Emerald 300", value: "bg-emerald-300" },
  { name: "Teal 300", value: "bg-teal-300" },
  { name: "Cyan 300", value: "bg-cyan-300" },
  { name: "Sky 300", value: "bg-sky-300" },
  { name: "Blue 300", value: "bg-blue-300" },
  { name: "Indigo 300", value: "bg-indigo-300" },
  { name: "Violet 300", value: "bg-violet-300" },
  { name: "Purple 300", value: "bg-purple-300" },
  { name: "Fuchsia 300", value: "bg-fuchsia-300" },
  { name: "Pink 300", value: "bg-pink-300" },
  { name: "Rose 300", value: "bg-rose-300" },

  // Darker shades
  { name: "Red 700", value: "bg-red-700" },
  { name: "Orange 700", value: "bg-orange-700" },
  { name: "Amber 700", value: "bg-amber-700" },
  { name: "Yellow 700", value: "bg-yellow-700" },
  { name: "Lime 700", value: "bg-lime-700" },
  { name: "Green 700", value: "bg-green-700" },
  { name: "Emerald 700", value: "bg-emerald-700" },
  { name: "Teal 700", value: "bg-teal-700" },
  { name: "Cyan 700", value: "bg-cyan-700" },
  { name: "Sky 700", value: "bg-sky-700" },
  { name: "Blue 700", value: "bg-blue-700" },
  { name: "Indigo 700", value: "bg-indigo-700" },
  { name: "Violet 700", value: "bg-violet-700" },
  { name: "Purple 700", value: "bg-purple-700" },
  { name: "Fuchsia 700", value: "bg-fuchsia-700" },
  { name: "Pink 700", value: "bg-pink-700" },
  { name: "Rose 700", value: "bg-rose-700" },

  // Neutral colors
  { name: "Slate 500", value: "bg-slate-500" },
  { name: "Gray 500", value: "bg-gray-500" },
  { name: "Zinc 500", value: "bg-zinc-500" },
  { name: "Neutral 500", value: "bg-neutral-500" },
  { name: "Stone 500", value: "bg-stone-500" },
  
  // Default
  { name: "Default", value: "default" },
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState(value || "default");

  useEffect(() => {
    setSelectedColor(value || "default");
  }, [value]);

  const filteredColors = search 
    ? TAILWIND_COLORS.filter(color => 
        color.name.toLowerCase().includes(search.toLowerCase()))
    : TAILWIND_COLORS;

  const handleColorSelect = (colorValue: string) => {
    setSelectedColor(colorValue);
    onChange(colorValue);
  };

  const getDisplayColor = (colorValue: string) => {
    if (colorValue === "default") return "bg-primary";
    return colorValue;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div 
          className={cn(
            "w-10 h-10 rounded-md border", 
            getDisplayColor(selectedColor)
          )}
          aria-label="Current color preview"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {TAILWIND_COLORS.find(c => c.value === selectedColor)?.name || "Custom Color"}
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

      <ScrollArea className="h-[300px] rounded-md border">
        <div className="grid grid-cols-4 gap-2 p-2">
          {filteredColors.map((color) => (
            <button
              key={color.value}
              className={cn(
                "w-full aspect-square rounded-md border transition-all",
                color.value === "default" ? "bg-primary" : color.value,
                selectedColor === color.value && "ring-2 ring-offset-2 ring-ring"
              )}
              onClick={() => handleColorSelect(color.value)}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
