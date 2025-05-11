
/**
 * This file contains patches for type errors related to ObjectType properties
 * 
 * To apply these patches:
 * 1. Import and use these helper functions in the affected files
 * 2. Fix property access by using the safe accessors
 * 
 * Example usage:
 * import { isArchived, hasSourceObjectId } from "@/patches/ObjectTypePatches";
 * 
 * // Instead of: if (objectType.is_archived)
 * if (isArchived(objectType))
 * 
 * // Instead of: if (objectType.source_object_id)
 * if (hasSourceObjectId(objectType))
 */

import { ObjectType } from "@/hooks/useObjectTypes";

// Safe accessor for is_archived property
export function isArchived(objectType: ObjectType): boolean {
  // First check if is_archived exists, fall back to !is_active if needed
  return 'is_archived' in objectType 
    ? Boolean(objectType.is_archived) 
    : !objectType.is_active;
}

// Safe accessor for source_object_id property
export function hasSourceObjectId(objectType: ObjectType): boolean {
  return 'source_object_id' in objectType && Boolean(objectType.source_object_id);
}

// Safe accessor to get source_object_id value
export function getSourceObjectId(objectType: ObjectType): string | null {
  return 'source_object_id' in objectType ? (objectType.source_object_id as string) : null;
}
