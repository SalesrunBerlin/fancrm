
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  imageSrc?: string;
  metric?: string;
  className?: string;
}

export const TestimonialCard = ({ 
  quote, 
  name, 
  role, 
  company,
  imageSrc,
  metric,
  className 
}: TestimonialCardProps) => {
  const initials = name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <Card className={cn("overflow-hidden h-full", className)}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-grow">
          <blockquote className="text-lg italic mb-4">"{quote}"</blockquote>
          {metric && (
            <div className="mb-4">
              <span className="text-2xl font-bold text-primary">{metric}</span>
            </div>
          )}
        </div>
        <div className="flex items-center mt-4">
          <Avatar className="h-10 w-10 mr-3">
            {imageSrc && <AvatarImage src={imageSrc} alt={name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{name}</div>
            {(role || company) && (
              <div className="text-sm text-muted-foreground">
                {role}{role && company && ", "}{company}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
