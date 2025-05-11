
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatchLookupValues } from "@/hooks/useBatchLookupValues";

interface BatchLookupValueDisplayProps {
  value: string;
  targetObjectTypeId: string;
}

/**
 * Optimized component for displaying lookup values that leverages batch loading
 */
export function BatchLookupValueDisplay({ value, targetObjectTypeId }: BatchLookupValueDisplayProps) {
  // Use the batch lookup hook even for a single value - it will automatically cache and batch with others
  const { lookupValues, isLoading } = useBatchLookupValues(
    value ? [value] : [], 
    targetObjectTypeId
  );
  
  const displayValue = value ? lookupValues[value] || value : "-";
  
  if (isLoading) {
    return <Skeleton className="h-4 w-24" />;
  }
  
  return <span>{displayValue}</span>;
}
