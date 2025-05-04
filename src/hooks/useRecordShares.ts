
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RecordShare, RecordShareField, ShareRecordParams } from '@/types/RecordSharing';

export function useRecordShares(recordId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch shares for a specific record
  const { data: shares, isLoading: isLoadingShares, error: sharesError } = useQuery({
    queryKey: ['record-shares', recordId],
    queryFn: async (): Promise<RecordShare[]> => {
      if (!recordId || !user) return [];
      
      // Try to get shares with associated user profiles
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          user_profile:shared_with_user_id(
            id,
            first_name,
            last_name,
            avatar_url,
            screen_name
          )
        `)
        .eq('record_id', recordId);
      
      if (error) {
        console.error('Error fetching record shares:', error);
        throw error;
      }
      
      return (data || []) as RecordShare[];
    },
    enabled: !!recordId && !!user,
  });

  // Fetch fields for all shares
  const { data: shareFields, isLoading: isLoadingFields } = useQuery({
    queryKey: ['record-share-fields', recordId, shares],
    queryFn: async (): Promise<Record<string, RecordShareField[]>> => {
      if (!shares || shares.length === 0) return {};
      
      const shareIds = shares.map(share => share.id);
      
      const { data, error } = await supabase
        .from('record_share_fields')
        .select('*')
        .in('record_share_id', shareIds);
      
      if (error) {
        console.error('Error fetching share fields:', error);
        throw error;
      }
      
      // Group fields by share_id
      return (data || []).reduce((acc, field) => {
        if (!acc[field.record_share_id]) {
          acc[field.record_share_id] = [];
        }
        acc[field.record_share_id].push(field as RecordShareField);
        return acc;
      }, {} as Record<string, RecordShareField[]>);
    },
    enabled: !!(shares && shares.length > 0),
  });

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
    shares,
    shareFields,
    isLoading: isLoadingShares || isLoadingFields,
    error: sharesError,
    shareRecord,
    updateShare,
    removeShare
  };
}
