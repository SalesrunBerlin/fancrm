
import React from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemedButton } from "@/components/ui/themed-button";

export interface PageHeaderProps {
  title?: string;
  heading?: string; // For backward compatibility
  description?: string;
  text?: string; // For backward compatibility
  actions?: React.ReactNode;
  className?: string;
  backTo?: string;
  backButton?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title,
  heading, // Support both title and heading for backward compatibility
  description,
  text, // Support both description and text for backward compatibility
  actions, 
  className, 
  backTo, 
  backButton,
  children 
}: PageHeaderProps) {
  const navigate = useNavigate();
  
  // Support both naming conventions for backward compatibility
  const displayTitle = title || heading || "";
  const displayDescription = description || text || "";
  
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    }
  };

  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-4", className)}>
      <div className="flex items-center gap-2">
        {backTo && (
          <ThemedButton 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 mr-1" 
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </ThemedButton>
        )}
        {backButton}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
          {displayDescription && (
            <p className="text-muted-foreground text-sm">{displayDescription}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      {children}
    </div>
  );
}
