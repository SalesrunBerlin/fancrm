
/**
 * This file provides compatibility for alert variants.
 * In newer versions of the alert component, additional variants might be needed.
 */

import { cn } from "@/lib/utils";

export interface ExtendedAlertProps {
  variant?: "default" | "destructive" | "warning";
  className?: string;
}

export function getAlertVariantClass(variant?: "default" | "destructive" | "warning") {
  switch (variant) {
    case "destructive":
      return "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive";
    case "warning":
      return "border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-500";
    default:
      return undefined;
  }
}

export function getExtendedAlertClass(props: ExtendedAlertProps) {
  return cn(getAlertVariantClass(props.variant), props.className);
}
