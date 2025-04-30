
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useDeleteObjectType() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Delete an object type with cascading deletion for all related data
  const deleteObjectType = useMutation({
    mutationFn: async (objectTypeId: string) => {
      if (!user) throw new Error("User must be logged in to delete object types");

      console.log(`Starting deletion of object type: ${objectTypeId}`);
      
      try {
        // Step 1: Delete field picklist values for this object's fields
        const { data: objectFields } = await supabase
          .from("object_fields")
          .select("id")
          .eq("object_type_id", objectTypeId);
            
        if (objectFields && objectFields.length > 0) {
          const fieldIds = objectFields.map(f => f.id);
          
          // Delete picklist values
          const { error: picklistError } = await supabase
            .from("field_picklist_values")
            .delete()
            .in("field_id", fieldIds);
            
          if (picklistError) {
            console.error("Error deleting field picklist values:", picklistError);
            throw picklistError;
          }
          
          // Step 2: Delete field display configs for this object's fields
          const { error: displayConfigError } = await supabase
            .from("field_display_configs")
            .delete()
            .in("field_id", fieldIds);
            
          if (displayConfigError) {
            console.error("Error deleting field display configs:", displayConfigError);
            throw displayConfigError;
          }
        }
        
        // Step 3: Delete field publishing settings for this object
        const { error: publishingError } = await supabase
          .from("object_field_publishing")
          .delete()
          .eq("object_type_id", objectTypeId);
          
        if (publishingError) {
          console.error("Error deleting field publishing settings:", publishingError);
          throw publishingError;
        }

        // Step 4: Get all records for this object type
        const { data: records, error: recordsError } = await supabase
          .from("object_records")
          .select("id")
          .eq("object_type_id", objectTypeId);
          
        if (recordsError) {
          console.error("Error retrieving object records:", recordsError);
          throw recordsError;
        }

        // Step 5: Delete all field values for these records
        if (records && records.length > 0) {
          const recordIds = records.map(r => r.id);
          
          // Delete from record_field_values
          const { error: fieldValuesError } = await supabase
            .from("record_field_values")
            .delete()
            .in("record_id", recordIds);
            
          if (fieldValuesError) {
            console.error("Error deleting record field values:", fieldValuesError);
            throw fieldValuesError;
          }
          
          // Delete from object_field_values
          const { error: objFieldValuesError } = await supabase
            .from("object_field_values")
            .delete()
            .in("record_id", recordIds);
            
          if (objFieldValuesError) {
            console.error("Error deleting object field values:", objFieldValuesError);
            throw objFieldValuesError;
          }
        }
        
        // Step 6: Delete all records for this object type
        const { error: deleteRecordsError } = await supabase
          .from("object_records")
          .delete()
          .eq("object_type_id", objectTypeId);
          
        if (deleteRecordsError) {
          console.error("Error deleting object records:", deleteRecordsError);
          throw deleteRecordsError;
        }
        
        // Step 7: Delete all relationships involving this object type
        const { error: relationsError } = await supabase
          .from("object_relationships")
          .delete()
          .or(`from_object_id.eq.${objectTypeId},to_object_id.eq.${objectTypeId}`);
          
        if (relationsError) {
          console.error("Error deleting object relationships:", relationsError);
          throw relationsError;
        }
        
        // Step 8: Delete all fields for this object type
        const { error: fieldsError } = await supabase
          .from("object_fields")
          .delete()
          .eq("object_type_id", objectTypeId);
          
        if (fieldsError) {
          console.error("Error deleting object fields:", fieldsError);
          throw fieldsError;
        }
        
        // Step 9: Finally, delete the object type itself
        const { error: objectError } = await supabase
          .from("object_types")
          .delete()
          .eq("id", objectTypeId);
          
        if (objectError) {
          console.error("Error deleting object type:", objectError);
          throw objectError;
        }
        
        console.log("Successfully deleted object type with all related data");
        return objectTypeId;
      } catch (error) {
        console.error("Error in deleteObjectType function:", error);
        throw error;
      }
    },
    onSuccess: (deletedObjectId) => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["published-objects"] });
      queryClient.invalidateQueries({ queryKey: ["object-fields", deletedObjectId] });
      toast({
        title: "Success",
        description: "Object type deleted successfully with all related data",
      });
    },
    onError: (error) => {
      console.error("Error deleting object type:", error);
      toast({
        title: "Error",
        description: "Failed to delete object type: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  });

  return {
    deleteObjectType
  };
}
