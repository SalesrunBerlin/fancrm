
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecordShare, RecordShareField } from '@/types/RecordSharing';

/**
 * Hook containing the query functions for record shares
 */
export function useRecordShareQueries(recordId?: string) {
  const { user } = useAuth();
  
  // Fetch shares for a specific record
  const { 
    data: shares, 
    isLoading: isLoadingShares, 
    error: sharesError 
  } = useQuery({
    queryKey: ['record-shares', recordId],
    queryFn: async (): Promise<RecordShare[]> => {
      if (!recordId || !user) return [];
      
      // Try to get shares with associated user profiles
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          user_profile:profiles!shared_with_user_id(
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
      
      return (data as any) || [];
    },
    enabled: !!recordId && !!user,
  });

  // Fetch fields for all shares
  const { 
    data: shareFields, 
    isLoading: isLoadingFields 
  } = useQuery({
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
      return (data || []).reduce((acc, field: any) => {
        if (!acc[field.record_share_id]) {
          acc[field.record_share_id] = [];
        }
        acc[field.record_share_id].push(field as RecordShareField);
        return acc;
      }, {} as Record<string, RecordShareField[]>);
    },
    enabled: !!(shares && shares.length > 0),
  });

  return {
    shares,
    shareFields,
    isLoadingShares,
    isLoadingFields,
    sharesError
  };
}
