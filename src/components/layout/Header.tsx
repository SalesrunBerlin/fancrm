
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavigationToggle } from "./NavigationToggle";
import { UserProfileMenu } from "./UserProfileMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { CommandSearch } from "@/components/search/CommandSearch";
import { GlobalActionsNav } from "@/components/actions/GlobalActionsNav";
import { ApplicationSwitcher } from "@/components/applications/ApplicationSwitcher";

export function Header() {
  const isMobile = useIsMobile();
  const [commandOpen, setCommandOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <NavigationToggle />
          {!isMobile && (
            <ApplicationSwitcher variant="ghost" size="sm" />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {!isMobile && (
            <>
              <div className="mr-2">
                <CommandSearch open={commandOpen} setOpen={setCommandOpen} />
              </div>
              <GlobalActionsNav />
            </>
          )}
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
