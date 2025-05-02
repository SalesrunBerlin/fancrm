
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

// For each file with a toast that has a variant property:

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
