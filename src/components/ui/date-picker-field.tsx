
import * as React from "react";
import { format, parse, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Save, X } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface DatePickerFieldProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  isDateTime?: boolean;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Select a date",
  disabled = false,
  className,
  clearable = true,
  isDateTime = false
}: DatePickerFieldProps) {
  // State for managing the popover
  const [open, setOpen] = React.useState(false);
  
  // State for temporarily storing date and time selections before saving
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  
  // State for hours and minutes (for datetime fields)
  const [hours, setHours] = React.useState<string>(
    value ? format(new Date(value), "HH") : "00"
  );
  const [minutes, setMinutes] = React.useState<string>(
    value ? format(new Date(value), "mm") : "00"
  );

  // Update local state when props value changes
  React.useEffect(() => {
    if (value) {
      const dateValue = new Date(value);
      setSelectedDate(dateValue);
      setHours(format(dateValue, "HH"));
      setMinutes(format(dateValue, "mm"));
    } else {
      setSelectedDate(undefined);
      setHours("00");
      setMinutes("00");
    }
  }, [value]);

  // Generate hours options for the select
  const hoursOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return (
      <SelectItem key={hour} value={hour}>
        {hour}
      </SelectItem>
    );
  });

  // Generate minutes options for the select
  const minutesOptions = Array.from({ length: 60 }, (_, i) => {
    const minute = i.toString().padStart(2, '0');
    return (
      <SelectItem key={minute} value={minute}>
        {minute}
      </SelectItem>
    );
  });

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    
    // If not a datetime field, automatically save and close
    if (!isDateTime && date) {
      saveAndClose(date);
    }
  };

  // Handle saving and closing the popover
  const saveAndClose = (dateToSave: Date | undefined = selectedDate) => {
    if (dateToSave) {
      // For datetime fields, apply the selected hours and minutes
      if (isDateTime) {
        dateToSave = setHours(dateToSave, parseInt(hours, 10));
        dateToSave = setMinutes(dateToSave, parseInt(minutes, 10));
        
        // Format as ISO string for storing with time
        const formattedDate = dateToSave.toISOString();
        onChange(formattedDate);
      } else {
        // For date-only fields, format as YYYY-MM-DD
        const formattedDate = format(dateToSave, "yyyy-MM-dd");
        onChange(formattedDate);
      }
    }
    
    setOpen(false);
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
        const formattedDate = isDateTime 
          ? parsedDate.toISOString()
          : format(parsedDate, "yyyy-MM-dd");
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
  const displayValue = () => {
    if (!value) return "";
    
    try {
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) return value;
      
      return isDateTime 
        ? format(dateValue, "PPp") // Date with time
        : format(dateValue, "PP"); // Date only
    } catch (err) {
      return value;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              type="text"
              value={displayValue()}
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
              onClick={() => setOpen(true)}
            >
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
        
        <PopoverContent align="start" className="w-auto p-0">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
            
            {isDateTime && (
              <div className="p-3 border-t space-y-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Label className="text-sm">Time</Label>
                </div>
                
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="hours" className="text-xs text-muted-foreground">Hours</Label>
                    <Select value={hours} onValueChange={setHours}>
                      <SelectTrigger id="hours">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>{hoursOptions}</SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="minutes" className="text-xs text-muted-foreground">Minutes</Label>
                    <Select value={minutes} onValueChange={setMinutes}>
                      <SelectTrigger id="minutes">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>{minutesOptions}</SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  className="w-full mt-2"
                  type="button"
                  onClick={() => saveAndClose()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
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
