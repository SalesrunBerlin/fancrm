
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if an object exists and has been created successfully
 */
export async function checkObjectExists(objectId: string): Promise<boolean> {
  if (!objectId) return false;

  try {
    console.log('Checking if object exists:', objectId);
    const { data, error } = await supabase
      .from('object_types')
      .select('id')
      .eq('id', objectId)
      .single();
    
    const exists = !error && data && data.id === objectId;
    console.log('Object exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking object existence:', error);
    return false;
  }
}

/**
 * Get mappings for shared data between source and target users and objects
 */
export async function getMappingsForShare(sourceUserId: string, sourceObjectId: string, currentUserId: string | undefined) {
  if (!currentUserId || !sourceUserId || !sourceObjectId) return [];

  try {
    console.log('Getting mappings for:', { sourceUserId, sourceObjectId, targetUserId: currentUserId });
    
    const { data, error } = await supabase
      .from('user_field_mappings')
      .select('*')
      .eq('source_user_id', sourceUserId)
      .eq('target_user_id', currentUserId)
      .eq('source_object_id', sourceObjectId);

    if (error) throw error;
    console.log('Found mappings:', data?.length || 0);
    
    return data || [];
  } catch (error) {
    console.error('Error getting field mappings:', error);
    return [];
  }
}

/**
 * Check if fields are properly mapped for a particular share
 */
export async function getMappingStatus(
  sourceUserId: string, 
  sourceObjectId: string, 
  sharedFieldApiNames: string[],
  currentUserId: string | undefined
) {
  if (!currentUserId || !sourceUserId || !sourceObjectId || !sharedFieldApiNames.length) {
    return { 
      isConfigured: false, 
      mappedFields: 0, 
      totalFields: sharedFieldApiNames.length 
    };
  }

  try {
    const mappings = await getMappingsForShare(sourceUserId, sourceObjectId, currentUserId);

    // Check how many of the shared fields are actually mapped to target fields
    // Filter out do_not_map entries
    const validMappings = mappings.filter(m => 
      m.target_field_api_name && 
      m.target_field_api_name !== 'do_not_map' &&
      sharedFieldApiNames.includes(m.source_field_api_name)
    );

    return {
      isConfigured: validMappings.length > 0,
      mappedFields: validMappings.length,
      totalFields: sharedFieldApiNames.length
    };
  } catch (error) {
    console.error('Error getting mapping status:', error);
    return { 
      isConfigured: false, 
      mappedFields: 0, 
      totalFields: sharedFieldApiNames.length 
    };
  }
}
