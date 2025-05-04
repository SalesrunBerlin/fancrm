
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CollectionShare } from '@/types/RecordSharing';

export function useCollections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all collections owned by the user
  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['collections'],
    queryFn: async (): Promise<CollectionShare[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('sharing_collections')
        .select('*')
        .eq('owner_id', user.id);
      
      if (error) {
        console.error('Error fetching collections:', error);
        throw error;
      }
      
      // For each collection, get member count and record count
      const collectionsWithCounts = await Promise.all((data || []).map(async (collection) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('collection_members')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);
        
        // Get record count
        const { count: recordCount } = await supabase
          .from('collection_records')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);
        
        return {
          ...collection,
          memberCount: memberCount || 0,
          recordCount: recordCount || 0
        };
      }));
      
      return collectionsWithCounts as any;
    },
    enabled: !!user,
  });
  
  // Create a new collection
  const createCollection = useMutation({
    mutationFn: async ({ 
      name, 
      description 
    }: { 
      name: string; 
      description?: string;
    }) => {
      if (!user) throw new Error('You must be logged in to create collections');
      if (!name.trim()) throw new Error('Collection name is required');
      
      const { data, error } = await supabase
        .from('sharing_collections')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          owner_id: user.id
        })
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created');
    },
    onError: (error: any) => {
      toast.error('Failed to create collection', {
        description: error.message
      });
    }
  });
  
  // Delete a collection
  const deleteCollection = useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('sharing_collections')
        .delete()
        .eq('id', collectionId)
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      return { collectionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete collection', {
        description: error.message
      });
    }
  });
  
  // Add records to a collection
  const addRecordsToCollection = useMutation({
    mutationFn: async ({ 
      collectionId, 
      recordIds 
    }: { 
      collectionId: string; 
      recordIds: string[];
    }) => {
      if (!user) throw new Error('You must be logged in');
      if (!collectionId) throw new Error('Collection ID is required');
      if (!recordIds.length) throw new Error('No records selected');
      
      const recordsToInsert = recordIds.map(recordId => ({
        collection_id: collectionId,
        record_id: recordId
      }));
      
      const { data, error } = await supabase
        .from('collection_records')
        .upsert(recordsToInsert)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-records', collectionId] });
      toast.success('Records added to collection');
    },
    onError: (error: any) => {
      toast.error('Failed to add records', {
        description: error.message
      });
    }
  });
  
  // Remove records from a collection
  const removeRecordsFromCollection = useMutation({
    mutationFn: async ({ 
      collectionId, 
      recordIds 
    }: { 
      collectionId: string; 
      recordIds: string[];
    }) => {
      if (!user) throw new Error('You must be logged in');
      if (!collectionId) throw new Error('Collection ID is required');
      if (!recordIds.length) throw new Error('No records selected');
      
      const { error } = await supabase
        .from('collection_records')
        .delete()
        .eq('collection_id', collectionId)
        .in('record_id', recordIds);
      
      if (error) throw error;
      return { collectionId, recordIds };
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-records', collectionId] });
      toast.success('Records removed from collection');
    },
    onError: (error: any) => {
      toast.error('Failed to remove records', {
        description: error.message
      });
    }
  });

  return {
    collections,
    isLoading,
    error,
    createCollection,
    deleteCollection,
    addRecordsToCollection,
    removeRecordsFromCollection
  };
}
