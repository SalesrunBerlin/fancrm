
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backTo?: string;
  className?: string;
}

export function PageHeader({ title, description, actions, backTo, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-4", className)}>
      <div>
        {backTo && (
          <Button
            variant="outline"
            size="sm"
            className="mb-2"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
