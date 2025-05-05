
import React from "react";
import { cn } from "@/lib/utils";

interface ContentPreviewProps {
  content: string;
  className?: string;
}

export function ContentPreview({ content, className }: ContentPreviewProps) {
  return (
    <div 
      className={cn("prose max-w-none", className)} 
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
