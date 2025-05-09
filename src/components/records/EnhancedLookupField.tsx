
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { cn } from "@/lib/utils";
import { QuickCreateLookup } from "./QuickCreateLookup";

interface EnhancedLookupFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  targetObjectTypeId: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export function EnhancedLookupField({
  value,
  onChange,
  targetObjectTypeId,
  disabled = false,
  placeholder = "Select...",
  required = false,
}: EnhancedLookupFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { records, isLoading, getLookupDisplayValue } = useObjectLookup(targetObjectTypeId);
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  useEffect(() => {
    // Get the display label for the current value when component mounts
    if (value) {
      getLookupDisplayValue(value).then((label) => {
        setSelectedLabel(label || value);
      });
    } else {
      setSelectedLabel("");
    }
  }, [value, getLookupDisplayValue]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);

    // Update the selected label
    const selected = records?.find((record) => record.id === selectedValue);
    if (selected) {
      setSelectedLabel(selected.displayName || selectedValue);
    }
  };

  const handleClear = () => {
    if (required) return;
    onChange(null);
    setSelectedLabel("");
  };

  const handleNewRecordCreated = (recordId: string, displayName: string) => {
    onChange(recordId);
    setSelectedLabel(displayName);
    setOpen(false);
  };

  const filteredRecords = records?.filter((record) =>
    record.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="flex items-center">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "w-full justify-between",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        
        {value && !disabled && !required && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 px-2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
        
        {!disabled && (
          <QuickCreateLookup 
            targetObjectTypeId={targetObjectTypeId} 
            onRecordCreated={handleNewRecordCreated}
            buttonVariant="ghost"
            className="ml-1 px-2"
            showLabel={false}
          />
        )}
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput 
            placeholder="Search..." 
            value={search} 
            onValueChange={setSearch} 
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            
            <CommandEmpty>No results found</CommandEmpty>
            
            <CommandGroup>
              {filteredRecords?.map((record) => (
                <CommandItem
                  key={record.id}
                  onSelect={() => handleSelect(record.id)}
                  className="flex items-center"
                >
                  {record.displayName}
                  {record.id === value && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandGroup>
              <CommandItem onSelect={() => setOpen(false)} className="border-t py-4">
                <QuickCreateLookup 
                  targetObjectTypeId={targetObjectTypeId} 
                  onRecordCreated={handleNewRecordCreated}
                  buttonVariant="default"
                  buttonSize="default"
                  className="w-full"
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
