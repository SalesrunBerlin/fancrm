
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface UseCaseCardProps {
  name: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}

export const UseCaseCard = ({ 
  name, 
  description,
  imageSrc,
  imageAlt = "Use case image", 
  className 
}: UseCaseCardProps) => {
  return (
    <Card className={cn("overflow-hidden h-full", className)}>
      {imageSrc && (
        <AspectRatio ratio={16 / 9}>
          <div className="bg-muted w-full h-full flex items-center justify-center">
            {imageSrc ? (
              <img 
                src={imageSrc} 
                alt={imageAlt} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-muted-foreground">Bild</div>
            )}
          </div>
        </AspectRatio>
      )}
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
