
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";
import { CommandSearch } from "@/components/search/CommandSearch";
import { NavigationToggle } from "./NavigationToggle";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {}

export function Header({ className }: HeaderProps) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-14 items-center w-full bg-background border-b px-4",
      className
    )}>
      <NavigationToggle />
      
      <div className="flex-1 flex justify-end items-center">
        <Button 
          variant="outline" 
          className="relative h-9 w-full md:w-40 lg:w-64 px-8 text-muted-foreground mr-4"
          onClick={() => setSearchDialogOpen(true)}
        >
          <Search className="absolute left-2 h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        
        <CommandSearch open={searchDialogOpen} setOpen={setSearchDialogOpen} />
        
        <div className="flex items-center space-x-2">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
