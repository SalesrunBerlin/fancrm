
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavigationToggle } from "./NavigationToggle";
import { UserProfileMenu } from "./UserProfileMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { CommandSearch } from "@/components/search/CommandSearch";

export function Header() {
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center">
          <NavigationToggle />
        </div>
        
        <div className="flex items-center">
          {!isMobile && (
            <div className="mr-4 max-w-sm">
              <CommandSearch />
            </div>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/profile" className="mr-2">
              Profile
            </Link>
          </Button>
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
