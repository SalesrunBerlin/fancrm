
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateFieldMapping } from '@/types/FieldMapping';
import { checkObjectExists, getMappingsForShare, getMappingStatus } from './useFieldMappingUtils';

export function useFieldMappings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Save mappings
  const saveFieldMappings = useMutation({
    mutationFn: async (mappings: CreateFieldMapping[]) => {
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
    checkObjectExists,
    getMappingsForShare: (sourceUserId: string, sourceObjectId: string) => 
      getMappingsForShare(sourceUserId, sourceObjectId, user?.id),
    getMappingStatus: (sourceUserId: string, sourceObjectId: string, sharedFieldApiNames: string[]) => 
      getMappingStatus(sourceUserId, sourceObjectId, sharedFieldApiNames, user?.id),
    saveFieldMappings
  };
}
