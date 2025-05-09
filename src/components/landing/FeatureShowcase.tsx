
import React from "react";

interface FeatureShowcaseProps {
  title: string;
  description: string;
  imageContent: React.ReactNode;
  reversed?: boolean;
}

export const FeatureShowcase = ({ 
  title, 
  description, 
  imageContent,
  reversed = false 
}: FeatureShowcaseProps) => {
  return (
    <div className={`grid gap-8 items-center ${reversed ? "lg:grid-cols-[1fr_1.5fr]" : "lg:grid-cols-[1.5fr_1fr]"}`}>
      {reversed ? (
        <>
          <div className="order-last lg:order-first">{imageContent}</div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter">{title}</h2>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter">{title}</h2>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
          <div>{imageContent}</div>
        </>
      )}
    </div>
  );
};
