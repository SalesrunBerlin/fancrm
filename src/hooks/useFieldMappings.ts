
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserFieldMapping, MappingStatus } from '@/types/FieldMapping';

export function useFieldMappings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all field mappings for the current user
  const { data: mappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ['user-field-mappings'],
    queryFn: async (): Promise<UserFieldMapping[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_field_mappings')
        .select('*')
        .eq('target_user_id', user.id);
      
      if (error) {
        console.error('Error fetching field mappings:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Check if an object type exists for the user
  const checkObjectExists = async (objectId: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('object_types')
      .select('id')
      .eq('id', objectId)
      .eq('owner_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking if object exists:', error);
      return false;
    }
    
    return !!data;
  };

  // Get mappings for a specific share (source user and object)
  const getMappingsForShare = async (sourceUserId: string, sourceObjectId: string): Promise<UserFieldMapping[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('user_field_mappings')
      .select('*')
      .eq('target_user_id', user.id)
      .eq('source_user_id', sourceUserId)
      .eq('source_object_id', sourceObjectId);
    
    if (error) {
      console.error('Error fetching share mappings:', error);
      throw error;
    }
    
    return data || [];
  };

  // Check mapping status for a shared record
  const getMappingStatus = async (sourceUserId: string, sourceObjectId: string, sourceFieldApiNames: string[]): Promise<MappingStatus> => {
    if (!user || !sourceFieldApiNames.length) {
      return { isConfigured: false, mappedFields: 0, totalFields: 0 };
    }
    
    try {
      const existingMappings = await getMappingsForShare(sourceUserId, sourceObjectId);
      
      // Check how many fields are mapped
      const mappedFields = sourceFieldApiNames.filter(fieldName => 
        existingMappings.some(mapping => mapping.source_field_api_name === fieldName)
      ).length;
      
      return {
        isConfigured: mappedFields > 0 && existingMappings.length > 0,
        mappedFields,
        totalFields: sourceFieldApiNames.length
      };
    } catch (error) {
      console.error('Error checking mapping status:', error);
      return { isConfigured: false, mappedFields: 0, totalFields: sourceFieldApiNames.length };
    }
  };

  // Create or update mappings with proper error handling using our new constraint
  const saveFieldMappings = useMutation({
    mutationFn: async (mappings: Omit<UserFieldMapping, 'id' | 'created_at' | 'updated_at'>[]) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Saving field mappings:', mappings);
      
      const { data, error } = await supabase
        .from('user_field_mappings')
        .upsert(
          mappings.map(mapping => ({
            ...mapping,
            target_user_id: user.id
          })),
          { 
            onConflict: 'source_user_id,target_user_id,source_object_id,source_field_api_name',
            ignoreDuplicates: false 
          }
        );
      
      if (error) {
        console.error('Error saving field mappings:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-field-mappings'] });
      toast.success('Field mappings saved successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to save field mappings', {
        description: error.message || 'Please try again'
      });
    }
  });

  return {
    mappings,
    isLoadingMappings,
    getMappingsForShare,
    getMappingStatus,
    saveFieldMappings,
    checkObjectExists
  };
}
