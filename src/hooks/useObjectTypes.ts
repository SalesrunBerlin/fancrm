
import { useFetchObjectTypes } from "./objectTypes/useFetchObjectTypes";
import { useObjectTypeCrud } from "./objectTypes/useObjectTypeCrud";
import { useObjectTypePublishing } from "./objectTypes/useObjectTypePublishing";
import { useObjectTypeImport } from "./objectTypes/useObjectTypeImport";
import { useSystemObjects } from "./objectTypes/useSystemObjects";
import { useDeleteObjectType } from "./objectTypes/useDeleteObjectType";
import { ObjectType, ObjectField } from "./objectTypes/types";

// Re-export the types for backward compatibility
export type { ObjectType, ObjectField };

export function useObjectTypes() {
  const { 
    objectTypes, 
    isLoading, 
    publishedObjects, 
    isLoadingPublished, 
    refreshPublishedObjects 
  } = useFetchObjectTypes();
  
  const { createObjectType, updateObjectType } = useObjectTypeCrud();
  const { publishObjectType, unpublishObjectType } = useObjectTypePublishing();
  const { importObjectType } = useObjectTypeImport();
  const { deleteSystemObjects } = useSystemObjects();
  const { deleteObjectType } = useDeleteObjectType();

  return {
    // From useFetchObjectTypes
    objectTypes,
    isLoading,
    publishedObjects,
    isLoadingPublished,
    refreshPublishedObjects,
    
    // From useObjectTypeCrud
    createObjectType,
    updateObjectType,
    
    // From useObjectTypePublishing
    publishObjectType,
    unpublishObjectType,
    
    // From useObjectTypeImport
    importObjectType,
    
    // From useSystemObjects
    deleteSystemObjects,
    
    // From useDeleteObjectType
    deleteObjectType
  };
}
