
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RelatedObjectType {
  id: string;
  name: string;
  api_name: string;
  is_system: boolean;
}

export interface RelationshipInfo {
  id: string;
  name: string;
  relationship_type: string;
  direction: 'from' | 'to';
  relatedObject: RelatedObjectType;
}

export function useObjectRelationships(objectTypeId: string | undefined) {
  return useQuery({
    queryKey: ["object-relationships", objectTypeId],
    queryFn: async (): Promise<RelationshipInfo[]> => {
      if (!objectTypeId) return [];
      
      console.log(`Fetching relationships for object: ${objectTypeId}`);
      
      // Get all relationships where this object type is involved
      const { data: relationships, error: relError } = await supabase
        .from("object_relationships")
        .select(`
          id,
          name,
          relationship_type,
          from_object_id,
          to_object_id
        `)
        .or(`from_object_id.eq.${objectTypeId},to_object_id.eq.${objectTypeId}`);

      if (relError) {
        console.error("Error fetching relationships:", relError);
        throw relError;
      }
      
      if (!relationships || relationships.length === 0) {
        return [];
      }

      // Extract all related object IDs (both from and to)
      const relatedObjectIds = relationships.reduce<string[]>((ids, rel) => {
        if (rel.from_object_id === objectTypeId) {
          ids.push(rel.to_object_id);
        } else {
          ids.push(rel.from_object_id);
        }
        return ids;
      }, []);
      
      // Fetch details of related objects
      const { data: relatedObjects, error: objError } = await supabase
        .from("object_types")
        .select("id, name, api_name, is_system")
        .in("id", relatedObjectIds);
        
      if (objError) {
        console.error("Error fetching related objects:", objError);
        throw objError;
      }

      // Map relationships to include object details
      return relationships.map(rel => {
        const isFromRelationship = rel.from_object_id === objectTypeId;
        const relatedObjectId = isFromRelationship ? rel.to_object_id : rel.from_object_id;
        const relatedObject = relatedObjects?.find(obj => obj.id === relatedObjectId);
        
        if (!relatedObject) {
          console.warn(`Related object not found for relationship: ${rel.id}`);
          return null;
        }
        
        return {
          id: rel.id,
          name: rel.name,
          relationship_type: rel.relationship_type,
          direction: isFromRelationship ? 'from' : 'to',
          relatedObject: relatedObject
        };
      }).filter(Boolean) as RelationshipInfo[];
    },
    enabled: !!objectTypeId
  });
}
