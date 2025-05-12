
import * as React from "react";
import { cn } from "@/lib/utils";

interface ColorOption {
  value: string;
  label: string;
}

const defaultColors: ColorOption[] = [
  { value: "#2563eb", label: "Blue" },        // blue-600
  { value: "#f97316", label: "Orange" },      // orange-500
  { value: "#06b6d4", label: "Cyan" },        // cyan-500
  { value: "#8b5cf6", label: "Purple" },      // purple-500
  { value: "#10b981", label: "Emerald" },     // emerald-500
  { value: "#f43f5e", label: "Rose" },        // rose-500
  { value: "#84cc16", label: "Lime" },        // lime-500
  { value: "#a855f7", label: "Violet" },      // violet-500
  { value: "#eab308", label: "Yellow" },      // yellow-500
  { value: "#6366f1", label: "Indigo" },      // indigo-500
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  colors?: ColorOption[];
}

export function ColorPicker({ 
  value, 
  onChange, 
  className,
  colors = defaultColors
}: ColorPickerProps) {
  const [customColor, setCustomColor] = React.useState<string>(
    // If value is not in predefined colors, use it as custom color
    colors.some(c => c.value === value) ? "" : value
  );

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color.value}
            type="button"
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all",
              value === color.value
                ? "border-black dark:border-white scale-110 shadow-md"
                : "border-transparent hover:scale-110"
            )}
            style={{ backgroundColor: color.value }}
            title={color.label}
            onClick={() => onChange(color.value)}
          />
        ))}
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={customColor || value}
          onChange={handleCustomColorChange}
          className="w-8 h-8 rounded overflow-hidden cursor-pointer"
        />
        <input
          type="text"
          value={customColor || value}
          onChange={handleCustomColorChange}
          placeholder="#RRGGBB"
          className="px-2 py-1 text-sm border rounded w-24"
        />
      </div>
    </div>
  );
}
