
/**
 * This file provides compatibility for toast variants.
 * In newer versions of the toast library, 'variant' is not supported.
 */

import { toast, type ToastOptions } from "sonner";

// Define our own extended toast options that includes variants
export interface ExtendedToastOptions extends ToastOptions {
  variant?: "default" | "destructive" | "success" | "warning";
}

// Safe error toast function that handles variant
export function safeErrorToast(message: string, options?: ExtendedToastOptions) {
  // Extract and remove the variant property
  const { variant, ...restOptions } = options || {};
  
  // Handle the variant by styling differently, but don't pass it to toast
  if (variant === "destructive") {
    // For destructive variant, we'd use error toast
    toast.error(message, restOptions);
  } else {
    // For other variants, use regular error toast
    toast.error(message, restOptions);
  }
}

// Safe warning toast function that handles variant
export function safeWarningToast(message: string, options?: ExtendedToastOptions) {
  const { variant, ...restOptions } = options || {};
  toast.warning(message, restOptions);
}

// Safe success toast function that handles variant
export function safeSuccessToast(message: string, options?: ExtendedToastOptions) {
  const { variant, ...restOptions } = options || {};
  toast.success(message, restOptions);
}
