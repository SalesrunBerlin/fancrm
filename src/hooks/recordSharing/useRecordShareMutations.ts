
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ShareRecordParams } from '@/types/RecordSharing';

/**
 * Hook containing mutation functions for record shares
 */
export function useRecordShareMutations(recordId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Share a record with a user
  const shareRecord = useMutation({
    mutationFn: async ({ recordId, sharedWithUserId, permissionLevel, visibleFields }: ShareRecordParams) => {
      if (!user) throw new Error('You must be logged in to share records');
      
      // First, create the share record
      const { data: shareData, error: shareError } = await supabase
        .from('record_shares')
        .insert({
          record_id: recordId,
          shared_by_user_id: user.id,
          shared_with_user_id: sharedWithUserId,
          permission_level: permissionLevel
        })
        .select();
      
      if (shareError) {
        console.error('Error creating record share:', shareError);
        throw shareError;
      }
      
      if (!shareData || shareData.length === 0) {
        throw new Error('Failed to create share record');
      }
      
      const newShareId = shareData[0].id;
      
      // Then create field visibility records
      const fieldsToInsert = visibleFields.map(fieldApiName => ({
        record_share_id: newShareId,
        field_api_name: fieldApiName,
        is_visible: true
      }));
      
      if (fieldsToInsert.length > 0) {
        const { error: fieldsError } = await supabase
          .from('record_share_fields')
          .insert(fieldsToInsert);
        
        if (fieldsError) {
          console.error('Error creating share fields:', fieldsError);
          throw fieldsError;
        }
      }
      
      return shareData[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-shares', recordId] });
      queryClient.invalidateQueries({ queryKey: ['record-share-count', recordId] });
      toast.success('Record shared successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to share record', {
        description: error.message || 'Please try again'
      });
    }
  });

  // Update an existing share
  const updateShare = useMutation({
    mutationFn: async ({ 
      shareId, 
      permissionLevel,
      visibleFields 
    }: { 
      shareId: string, 
      permissionLevel?: 'read' | 'edit',
      visibleFields?: string[] 
    }) => {
      if (!user) throw new Error('You must be logged in to update shares');
      
      // Update share if needed
      if (permissionLevel) {
        const { error } = await supabase
          .from('record_shares')
          .update({ permission_level: permissionLevel })
          .eq('id', shareId)
          .eq('shared_by_user_id', user.id);
        
        if (error) throw error;
      }
      
      // Update fields if needed
      if (visibleFields && visibleFields.length > 0) {
        // First delete existing fields
        const { error: deleteError } = await supabase
          .from('record_share_fields')
          .delete()
          .eq('record_share_id', shareId);
        
        if (deleteError) throw deleteError;
        
        // Then insert new fields
        const fieldsToInsert = visibleFields.map(fieldApiName => ({
          record_share_id: shareId,
          field_api_name: fieldApiName,
          is_visible: true
        }));
        
        const { error: insertError } = await supabase
          .from('record_share_fields')
          .insert(fieldsToInsert);
        
        if (insertError) throw insertError;
      }
      
      return { shareId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-shares', recordId] });
      queryClient.invalidateQueries({ queryKey: ['record-share-fields', recordId] });
      toast.success('Share updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update share', {
        description: error.message || 'Please try again'
      });
    }
  });

  // Delete a share
  const removeShare = useMutation({
    mutationFn: async (shareId: string) => {
      if (!user) throw new Error('You must be logged in to remove shares');
      
      const { error } = await supabase
        .from('record_shares')
        .delete()
        .eq('id', shareId)
        .eq('shared_by_user_id', user.id);
      
      if (error) throw error;
      return { shareId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-shares', recordId] });
      queryClient.invalidateQueries({ queryKey: ['record-share-count', recordId] });
      toast.success('Share removed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to remove share', {
        description: error.message || 'Please try again'
      });
    }
  });

  return {
    shareRecord,
    updateShare,
    removeShare
  };
}
