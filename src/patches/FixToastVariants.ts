
/**
 * This file provides utility functions to fix toast variant issues.
 * 
 * The error occurs because the toast library we're using doesn't support
 * the 'variant' property in the options object.
 */

import { toast, ExternalToast } from 'sonner';

// Safe toast wrappers without variant property
export function safeSuccessToast(message: string, options?: Omit<ExternalToast, 'variant'>) {
  toast.success(message, options);
}

export function safeErrorToast(message: string, options?: Omit<ExternalToast, 'variant'>) {
  toast.error(message, options);
}

export function safeInfoToast(message: string, options?: Omit<ExternalToast, 'variant'>) {
  toast.info(message, options);
}

// Use these functions instead of:
// toast.success("Message", { variant: "default" });
// toast.error("Message", { variant: "destructive" });
// 
// Example usage:
// import { safeSuccessToast, safeErrorToast } from "@/patches/FixToastVariants";
// 
// safeSuccessToast("Object archived successfully");
// safeErrorToast("Failed to archive object", { description: "Error details here" });
