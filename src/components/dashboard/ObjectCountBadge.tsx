
import React from 'react';
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ObjectCountBadgeProps {
  objectTypeId: string;
  className?: string;
}

export function ObjectCountBadge({ objectTypeId, className }: ObjectCountBadgeProps) {
  const { records, isLoading } = useObjectRecords(objectTypeId);
  
  if (isLoading) {
    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>...</span>
      </Badge>
    );
  }
  
  const count = records?.length || 0;
  
  return (
    <Badge variant="outline" className={`${className} bg-primary/10 text-primary`}>
      {count}
    </Badge>
  );
}
