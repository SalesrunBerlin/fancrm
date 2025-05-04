
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type FieldMapping = {
  id: string;
  source_user_id: string;
  target_user_id: string;
  source_object_id: string;
  target_object_id: string;
  source_field_api_name: string;
  target_field_api_name: string;
};

export function useFieldMappings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if an object exists and has been created successfully
  const checkObjectExists = async (objectId: string) => {
    if (!objectId) return false;

    try {
      const { data, error } = await supabase
        .from('object_types')
        .select('id')
        .eq('id', objectId)
        .single();
      
      return !error && data && data.id === objectId;
    } catch (error) {
      console.error('Error checking object existence:', error);
      return false;
    }
  };

  // Get mappings for shared data between source and target users and objects
  const getMappingsForShare = async (sourceUserId: string, sourceObjectId: string) => {
    if (!user || !sourceUserId || !sourceObjectId) return [];

    try {
      console.log('Getting mappings for:', { sourceUserId, sourceObjectId, targetUserId: user.id });
      
      const { data, error } = await supabase
        .from('user_field_mappings')
        .select('*')
        .eq('source_user_id', sourceUserId)
        .eq('target_user_id', user.id)
        .eq('source_object_id', sourceObjectId);

      if (error) throw error;
      console.log('Found mappings:', data?.length || 0);
      
      return data || [];
    } catch (error) {
      console.error('Error getting field mappings:', error);
      return [];
    }
  };

  // Check if fields are properly mapped for a particular share
  const getMappingStatus = async (
    sourceUserId: string, 
    sourceObjectId: string, 
    sharedFieldApiNames: string[]
  ) => {
    if (!user || !sourceUserId || !sourceObjectId || !sharedFieldApiNames.length) {
      return { 
        isConfigured: false, 
        mappedFields: 0, 
        totalFields: sharedFieldApiNames.length 
      };
    }

    try {
      const mappings = await getMappingsForShare(sourceUserId, sourceObjectId);

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
  };

  // Save mappings
  const saveFieldMappings = useMutation({
    mutationFn: async (mappings: FieldMapping[]) => {
      if (!user) throw new Error('User not authenticated');
      if (!mappings.length) throw new Error('No mappings to save');

      console.log('Saving mappings:', mappings.length);

      // Filter out do_not_map fields
      const validMappings = mappings.filter(m => 
        m.target_field_api_name !== 'do_not_map'
      );

      if (validMappings.length === 0) {
        throw new Error('At least one field must be mapped');
      }

      const { data, error } = await supabase
        .from('user_field_mappings')
        .upsert(validMappings)
        .select();

      if (error) {
        console.error('Error saving mappings:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-mappings'] });
      toast.success('Field mappings saved successfully');
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error('Failed to save field mappings', {
        description: error.message || 'An error occurred while saving mappings'
      });
    }
  });

  return {
    mappings: [],
    checkObjectExists,
    getMappingsForShare,
    getMappingStatus,
    saveFieldMappings
  };
}

export type { FieldMapping };
