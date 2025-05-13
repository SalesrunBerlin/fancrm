
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./scroll-area";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "./badge";

interface Option {
  label: string;
  value: string;
}

interface SelectMultipleProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function SelectMultiple({
  options,
  values,
  onChange,
  placeholder = "Select options...",
  className,
}: SelectMultipleProps) {
  const [open, setOpen] = React.useState(false);
  
  const handleToggleOption = (value: string) => {
    const newValues = values.includes(value)
      ? values.filter(v => v !== value)
      : [...values, value];
    onChange(newValues);
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };
  
  const selectedOptions = options.filter(option => values.includes(option.value));

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 border border-input"
          >
            <div className="flex flex-1 flex-wrap gap-1 items-center">
              {selectedOptions.length > 0 ? (
                selectedOptions.map(option => (
                  <Badge 
                    key={option.value}
                    variant="secondary"
                    className="mr-1 mb-1"
                  >
                    {option.label}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleOption(option.value);
                      }}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {option.label}</span>
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center">
              {selectedOptions.length > 0 && (
                <button
                  className="mr-2"
                  onMouseDown={handleClear}
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 border border-input bg-popover" align="start">
          <ScrollArea className="h-[300px]">
            <div className="p-2 space-y-1">
              {options.map(option => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleToggleOption(option.value)}
                >
                  <Checkbox
                    id={`option-${option.value}`}
                    checked={values.includes(option.value)}
                    onCheckedChange={() => handleToggleOption(option.value)}
                  />
                  <label
                    htmlFor={`option-${option.value}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option.label}
                  </label>
                  {values.includes(option.value) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
