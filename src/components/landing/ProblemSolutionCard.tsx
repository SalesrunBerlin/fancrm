
import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProblemSolutionCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  isLight?: boolean;
  className?: string;
}

export const ProblemSolutionCard = ({ 
  icon, 
  title, 
  description, 
  isLight = false, 
  className 
}: ProblemSolutionCardProps) => {
  return (
    <Card 
      className={cn(
        "flex flex-col items-center p-6 text-center h-full transition-all duration-300 hover:shadow-md", 
        isLight ? "bg-background border-muted" : "bg-muted/50",
        className
      )}
    >
      <div className={cn(
        "h-14 w-14 rounded-full flex items-center justify-center mb-4",
        isLight ? "bg-primary/10" : "bg-background"
      )}>
        <div className="text-primary text-2xl">{icon}</div>
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </Card>
  );
};
