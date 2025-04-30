
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Search, Calendar, User, Building, Briefcase, Box, Upload, Globe } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CommandSearchProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandSearch({ open, setOpen }: CommandSearchProps) {
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const { 
    searchTerm, 
    setSearchTerm, 
    isSearching, 
    groupedResults 
  } = useGlobalSearch();
  
  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      // Wait a bit before clearing to avoid flickering if quickly reopened
      const timer = setTimeout(() => setSearchTerm(''), 300);
      return () => clearTimeout(timer);
    }
  }, [open, setSearchTerm]);

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-4 w-4" />;
      case 'building': return <Building className="h-4 w-4" />;
      case 'briefcase': return <Briefcase className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      default: return <Box className="h-4 w-4" />;
    }
  };

  // Log the search state for debugging
  console.log("CommandSearch render state:", {
    searchTerm,
    isSearching,
    groupedResultsCount: groupedResults.length,
    groupedResults
  });
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Suche in allen Objekten..." 
        value={searchTerm}
        onValueChange={(value) => {
          console.log("Search input changed:", value);
          setSearchTerm(value);
        }}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="py-6 text-center">
              <Skeleton className="h-4 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ) : (
            "Keine Ergebnisse gefunden."
          )}
        </CommandEmpty>
        
        {/* Navigation section always visible */}
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
            <span>Einstellungen</span>
          </CommandItem>
        </CommandGroup>
        
        {/* Show object type navigation */}
        {objectTypes && objectTypes.length > 0 && (
          <CommandGroup heading="Objekte">
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
                  {getIconComponent(type.icon)}
                  <span className="ml-2">{type.name}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        )}
        
        {/* Show import options for object types */}
        {objectTypes && objectTypes.length > 0 && (
          <CommandGroup heading="Import">
            {objectTypes
              .filter(type => type.is_active)
              .map(type => (
                <CommandItem
                  key={`import-${type.id}`}
                  onSelect={() => {
                    navigate(`/objects/${type.id}/import`);
                    setOpen(false);
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="ml-2">Import {type.name}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        )}
        
        {/* Show search results when there's a search term */}
        {searchTerm && groupedResults.length > 0 && (
          <>
            <CommandSeparator />
            
            <CommandGroup heading="Suchergebnisse">
              {groupedResults.map((group) => (
                <div key={group.objectTypeId} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center">
                    {getIconComponent(group.objectIcon)}
                    <span className="ml-1">{group.objectTypeName}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {group.totalCount}
                    </Badge>
                  </div>
                  
                  {group.results.slice(0, 5).map((result) => (
                    <CommandItem
                      key={result.recordId}
                      onSelect={() => {
                        navigate(`/objects/${result.objectTypeId}/${result.recordId}`);
                        setOpen(false);
                      }}
                      className="pl-4"
                    >
                      <div className="flex flex-col w-full overflow-hidden">
                        <div className="font-medium truncate">{result.primaryValue}</div>
                        
                        {result.matchedField && result.matchedField !== result.primaryField && (
                          <div className="text-xs text-muted-foreground truncate">
                            {result.matchedField}: {result.matchedValue}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(result.lastUpdated)}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                  
                  {group.results.length > 5 && (
                    <CommandItem
                      onSelect={() => {
                        navigate(`/objects/${group.objectTypeId}?search=${encodeURIComponent(searchTerm)}`);
                        setOpen(false);
                      }}
                      className="pl-4 italic text-sm"
                    >
                      Alle {group.totalCount} Ergebnisse anzeigen...
                    </CommandItem>
                  )}
                </div>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
