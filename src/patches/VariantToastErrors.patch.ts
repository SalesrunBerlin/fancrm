
/**
 * This file contains patches for build errors related to toast 'variant' properties
 * 
 * To apply these patches:
 * 1. Open the files with toast variant errors
 * 2. Find the error locations and use the fixes below
 * 
 * Affected files:
 * - useInitializeObjects.ts
 * - EditRecordPage.tsx
 * - ObjectArchivePage.tsx
 * - ObjectDeletePage.tsx
 * - ObjectRestorePage.tsx
 */

/*
Common issue: 'variant' does not exist in type 'ExternalToast'
Fix: Remove the variant property or update toast library
*/

// Replace:
// toast.success("Message", { variant: "default" });
// With:
// toast.success("Message");

// Replace:
// toast.error("Message", { variant: "destructive" });
// With: 
// toast.error("Message");

// For ObjectArchivePage.tsx with type '"warning"' error:
// Replace:
// <Alert variant="warning">
// With:
// <Alert>
// Or with a valid variant:
// <Alert variant="default">

/**
 * Safe toast wrapper functions
 */
export function safeSuccessToast(message: string) {
  return { success: message };
}

export function safeErrorToast(message: string) {
  return { error: message };
}

export function safeInfoToast(message: string) {
  return { info: message };
}

/**
 * Implementation examples:
 * 
 * 1. In ObjectArchivePage.tsx:
 * import { safeSuccessToast, safeErrorToast } from "@/patches/VariantToastErrors.patch";
 * 
 * // Replace:
 * // toast.success("Object archived successfully", { variant: "default" });
 * 
 * // With:
 * toast(safeSuccessToast("Object archived successfully"));
 * 
 * // Replace:
 * // toast.error("Failed to archive object", { variant: "destructive" });
 * 
 * // With:
 * toast(safeErrorToast("Failed to archive object"));
 * 
 * 2. For Alert component with "warning" variant:
 * // Replace:
 * // <Alert variant="warning">
 * 
 * // With:
 * <Alert variant="default">
 */

