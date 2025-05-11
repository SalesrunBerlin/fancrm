
/**
 * Helper functions for handling property differences in ObjectType
 */

import { ObjectType } from "@/hooks/useObjectTypes";

/**
 * Helper function to check if an object is archived
 * This abstracts away differences in API between is_archived and archived properties
 */
export function isArchived(objectType: ObjectType): boolean {
  // Check both possible property names for backward compatibility
  return objectType.is_archived === true || objectType.archived === true;
}

/**
 * Helper function to get the source object ID 
 * This abstracts away differences in API between source_object_id property names
 */
export function getSourceObjectId(objectType: ObjectType): string | undefined {
  // Return the source_object_id property if it exists
  return objectType.source_object_id;
}
