
import { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CommandSearchProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandSearch({ open, setOpen }: CommandSearchProps) {
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  
  return (
    <div>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-64 justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search...</span>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => {
              navigate("/dashboard");
              setOpen(false);
            }}>
              <Search className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              navigate("/settings");
              setOpen(false);
            }}>
              <Search className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
          
          {objectTypes && objectTypes.length > 0 && (
            <CommandGroup heading="Objects">
              {objectTypes
                .filter(type => type.is_active)
                .map(type => (
                  <CommandItem
                    key={type.id}
                    onSelect={() => {
                      navigate(`/objects/${type.id}`);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2">{type.icon || "📋"}</span>
                    <span>{type.name}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
