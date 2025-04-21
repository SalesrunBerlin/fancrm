
import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Menu, Plus } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";
import { CreateContactForm } from "@/components/contacts/CreateContactForm";
import { CreateAccountForm } from "@/components/accounts/CreateAccountForm";
import { CreateDealForm } from "@/components/deals/CreateDealForm";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  onMenuClick: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export function Header({ onMenuClick, buttonRef, className }: HeaderProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const location = useLocation();

  const getCurrentPath = () => {
    if (location.pathname.includes("/contacts")) return "contacts";
    if (location.pathname.includes("/accounts")) return "accounts";
    if (location.pathname.includes("/deals")) return "deals";
    return null;
  };

  const renderCreateModal = () => {
    const currentPath = getCurrentPath();
    if (!showCreateModal) return null;

    switch (currentPath) {
      case "contacts":
        return <CreateContactForm isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />;
      case "accounts":
        return <CreateAccountForm isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />;
      case "deals":
        return <CreateDealForm isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />;
      default:
        return null;
    }
  };

  const currentPath = getCurrentPath();

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4",
      className
    )}>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="mr-2"
          aria-label="Toggle menu"
          ref={buttonRef}
        >
          <Menu className="h-5 w-5" />
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
          {currentPath && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          )}
          <UserProfileMenu />
        </div>
      </div>

      {renderCreateModal()}
    </header>
  );
}
