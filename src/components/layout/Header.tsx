
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Menu, X } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  onMenuClick: () => void;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    onMenuClick();
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4",
      className
    )}>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-2 lg:hidden"
          aria-label="Toggle menu"
        >
          {sidebarVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="font-semibold hidden md:block">CRMbeauty</h1>
      </div>
      
      <div className={cn(
        "flex items-center gap-4",
        searchExpanded ? "w-full md:w-1/2 justify-end" : "justify-end"
      )}>
        <div className={cn(
          "relative", 
          searchExpanded ? "w-full" : "w-auto"
        )}>
          {searchExpanded ? (
            <Input
              placeholder="Search..."
              className="w-full pr-8"
              autoFocus
              onBlur={() => setSearchExpanded(false)}
            />
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className={searchExpanded ? "absolute right-0 top-0" : ""}
            onClick={() => setSearchExpanded(!searchExpanded)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="ml-2 flex items-center space-x-2">
          <Button variant="outline" size="sm" className="hidden md:flex">
            Upgrade
          </Button>
          <Button size="sm" className="bg-beauty hover:bg-beauty-dark">
            New
          </Button>
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
