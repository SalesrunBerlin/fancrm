
import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, X } from "lucide-react";
import { Input } from "./input";

interface DatePickerFieldProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Select a date",
  disabled = false,
  className,
  clearable = true
}: DatePickerFieldProps) {
  // Convert string date to Date object for the calendar
  const dateValue = value ? new Date(value) : undefined;
  
  // Handle date selection from calendar
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD for storage
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange(formattedDate);
    } else {
      onChange(null);
    }
  };

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!inputValue) {
      onChange(null);
      return;
    }
    
    // Try to parse the input as a date
    try {
      const parsedDate = new Date(inputValue);
      if (!isNaN(parsedDate.getTime())) {
        const formattedDate = format(parsedDate, "yyyy-MM-dd");
        onChange(formattedDate);
      } else {
        onChange(inputValue); // Keep raw input for validation elsewhere
      }
    } catch (err) {
      onChange(inputValue); // Keep raw input if parsing fails
    }
  };

  // Handle clearing the date
  const handleClear = () => {
    onChange(null);
  };

  // Format display value for the input field
  const displayValue = dateValue ? format(dateValue, "PP") : value || "";

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="absolute right-0 top-0 h-full"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      {clearable && value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-8 top-0 h-full"
          onClick={handleClear}
        >
          <X className="h-4 w-4 opacity-50" />
          <span className="sr-only">Clear date</span>
        </Button>
      )}
    </div>
  );
}
