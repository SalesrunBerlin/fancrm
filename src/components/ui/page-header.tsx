
import React from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  backTo?: string;
}

export function PageHeader({ title, description, actions, className, backTo }: PageHeaderProps) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    }
  };

  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-4", className)}>
      <div className="flex items-center gap-2">
        {backTo && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 mr-1" 
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
