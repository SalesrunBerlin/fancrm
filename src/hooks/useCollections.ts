import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CollectionShare, CollectionMember } from '@/types/RecordSharing';

export function useCollections() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch collections owned by the user (direct database query works fine with our RLS)
  const { data: ownedCollections, isLoading: isLoadingOwned, error: ownedError } = useQuery({
    queryKey: ['owned-collections'],
    queryFn: async (): Promise<CollectionShare[]> => {
      if (!user) return [];
      
      // This query works with our RLS - owners can see their collections
      const { data, error } = await supabase
        .from('sharing_collections')
        .select('*');
      
      if (error) {
        console.error('Error fetching owned collections:', error);
        throw error;
      }
      
      // For each collection, get member count and record count
      const collectionsWithCounts = await Promise.all((data || []).map(async (collection) => {
        try {
          // Get member count
          const { count: memberCount, error: memberError } = await supabase
            .from('collection_members')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);
          
          if (memberError) {
            console.error('Error fetching member count:', memberError);
          }
          
          // Get record count
          const { count: recordCount, error: recordError } = await supabase
            .from('collection_records')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);
          
          if (recordError) {
            console.error('Error fetching record count:', recordError);
          }
          
          return {
            ...collection,
            memberCount: memberCount || 0,
            recordCount: recordCount || 0
          };
        } catch (error) {
          console.error(`Error processing collection ${collection.id}:`, error);
          return {
            ...collection,
            memberCount: 0,
            recordCount: 0
          };
        }
      }));
      
      return collectionsWithCounts as any;
    },
    enabled: !!user,
  });
  
  // Fetch collections where the user is a member (using Edge Function to avoid circular dependencies)
  const { data: memberCollections, isLoading: isLoadingMember, error: memberError } = useQuery({
    queryKey: ['member-collections'],
    queryFn: async (): Promise<CollectionShare[]> => {
      if (!user || !session) return [];
      
      console.log('Calling the collection-operations edge function with auth');
      
      try {
        // Use our Edge Function with explicit auth header to safely get member collections
        const { data, error } = await supabase.functions.invoke('collection-operations', {
          body: { type: 'getMemberCollections' }
        });
        
        if (error) {
          console.error('Error fetching member collections:', error);
          throw error;
        }
        
        return data?.data || [];
      } catch (error) {
        console.error('Error fetching member collections:', error);
        return [];
      }
    },
    enabled: !!user && !!session,
  });
  
  // Combine owned and member collections
  const collections = useMemo(() => {
    const owned = ownedCollections || [];
    const member = memberCollections || [];
    
    // Filter out duplicates (in case user is both owner and member)
    const ownedIds = new Set(owned.map(c => c.id));
    const uniqueMember = member.filter(c => !ownedIds.has(c.id));
    
    return [...owned, ...uniqueMember];
  }, [ownedCollections, memberCollections]);

  // Get a single collection by ID
  const useCollection = (collectionId: string | undefined) => {
    return useQuery({
      queryKey: ['collection', collectionId],
      queryFn: async (): Promise<CollectionShare | null> => {
        if (!user || !collectionId) return null;
        
        // Try to get as owner first
        const { data: ownerData, error: ownerError } = await supabase
          .from('sharing_collections')
          .select('*')
          .eq('id', collectionId)
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (ownerError) {
          console.error('Error fetching collection as owner:', ownerError);
        }
        
        if (ownerData) {
          return ownerData as CollectionShare;
        }
        
        // If not owner, check if user is a member
        const { data: memberCheckData, error: memberCheckError } = await supabase.rpc(
          'get_user_collection_membership',
          { user_uuid: user.id, collection_uuid: collectionId }
        );
        
        if (memberCheckError) {
          console.error('Error checking collection membership:', memberCheckError);
        }
        
        // Only attempt to fetch collection data if user is a member
        if (memberCheckData) {
          const { data: collectionData, error: collectionError } = await supabase
            .from('sharing_collections')
            .select('*')
            .eq('id', collectionId)
            .maybeSingle();
            
          if (collectionError) {
            console.error('Error fetching collection as member:', collectionError);
          }
          
          if (collectionData) {
            return collectionData as CollectionShare;
          }
        }
        
        return null;
      },
      enabled: !!user && !!collectionId,
    });
  };
  
  // Create a new collection - use direct database access instead of edge function
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
      
      console.log('Creating collection directly with RLS, name:', name.trim());
      
      const { data, error } = await supabase
        .from('sharing_collections')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          owner_id: user.id
        })
        .select();
      
      if (error) {
        console.error('Error creating collection:', error);
        throw error;
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-collections'] });
      toast.success('Collection created');
    },
    onError: (error: any) => {
      toast.error('Failed to create collection', {
        description: error.message
      });
    }
  });
  
  // Update a collection
  const updateCollection = useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      description 
    }: { 
      id: string; 
      name: string; 
      description?: string;
    }) => {
      if (!user) throw new Error('You must be logged in');
      if (!name.trim()) throw new Error('Collection name is required');
      
      const { data, error } = await supabase
        .from('sharing_collections')
        .update({
          name: name.trim(),
          description: description?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating collection:', error);
        throw error;
      }
      
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owned-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', variables.id] });
      toast.success('Collection updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update collection', {
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
        .eq('id', collectionId);
      
      if (error) {
        console.error('Error deleting collection:', error);
        throw error;
      }
      
      return { collectionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-collections'] });
      queryClient.invalidateQueries({ queryKey: ['member-collections'] });
      toast.success('Collection deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete collection', {
        description: error.message
      });
    }
  });
  
  // Get collection members
  const useCollectionMembers = (collectionId: string | undefined) => {
    return useQuery({
      queryKey: ['collection-members', collectionId],
      queryFn: async (): Promise<CollectionMember[]> => {
        if (!user || !collectionId) return [];
        
        // First check if user is owner or member
        const { data: isOwner } = await supabase.rpc(
          'user_owns_collection_safe',
          { collection_uuid: collectionId, user_uuid: user.id }
        );
        
        const { data: isMember } = await supabase.rpc(
          'get_user_collection_membership',
          { user_uuid: user.id, collection_uuid: collectionId }
        );
        
        if (!isOwner && !isMember) {
          console.log('User is neither owner nor member of this collection');
          return [];
        }
        
        const { data, error } = await supabase
          .from('collection_members')
          .select(`
            *,
            user_profile:profiles!user_id(
              id,
              first_name,
              last_name,
              avatar_url,
              screen_name
            )
          `)
          .eq('collection_id', collectionId);
        
        if (error) {
          console.error('Error fetching collection members:', error);
          throw error;
        }
        
        return data as any;
      },
      enabled: !!user && !!collectionId,
    });
  };
  
  // Add a member to a collection using edge function
  const addMember = useMutation({
    mutationFn: async ({ 
      collectionId, 
      userId, 
      permissionLevel 
    }: { 
      collectionId: string; 
      userId: string; 
      permissionLevel: 'read' | 'edit';
    }) => {
      if (!user || !session) throw new Error('You must be logged in');
      
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: {
          type: 'addMemberToCollection',
          collectionId,
          userId,
          permissionLevel
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error adding member:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection-members', variables.collectionId] });
      toast.success('Member added to collection');
    },
    onError: (error: any) => {
      toast.error('Failed to add member', {
        description: error.message
      });
    }
  });
  
  // Remove a member from a collection using edge function
  const removeMember = useMutation({
    mutationFn: async ({ 
      collectionId, 
      memberId 
    }: { 
      collectionId: string; 
      memberId: string;
    }) => {
      if (!user || !session) throw new Error('You must be logged in');
      
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: {
          type: 'removeMemberFromCollection',
          collectionId,
          memberId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error removing member:', error);
        throw error;
      }
      
      return { memberId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection-members', variables.collectionId] });
      toast.success('Member removed from collection');
    },
    onError: (error: any) => {
      toast.error('Failed to remove member', {
        description: error.message
      });
    }
  });
  
  // Update member permission level using edge function
  const updateMemberPermission = useMutation({
    mutationFn: async ({ 
      collectionId, 
      memberId, 
      permissionLevel 
    }: { 
      collectionId: string; 
      memberId: string; 
      permissionLevel: 'read' | 'edit';
    }) => {
      if (!user || !session) throw new Error('You must be logged in');
      
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: {
          type: 'updateMemberPermission',
          collectionId,
          memberId,
          permissionLevel
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error updating permissions:', error);
        throw error;
      }
      
      return { memberId, permissionLevel };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection-members', variables.collectionId] });
      toast.success('Member permissions updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update permissions', {
        description: error.message
      });
    }
  });
  
  // Add records to a collection (using Edge Function)
  const addRecordsToCollection = useMutation({
    mutationFn: async ({ 
      collectionId, 
      recordIds 
    }: { 
      collectionId: string; 
      recordIds: string[];
    }) => {
      if (!user || !session) throw new Error('You must be logged in');
      if (!collectionId) throw new Error('Collection ID is required');
      if (!recordIds.length) throw new Error('No records selected');
      
      // Use Edge Function with explicit auth header
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: {
          type: 'addRecordsToCollection',
          collectionId,
          recordIds
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error adding records:', error);
        throw error;
      }
      
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
  
  // Add fields to a collection (using Edge Function)
  const addFieldsToCollection = useMutation({
    mutationFn: async ({ 
      collectionId, 
      objectTypeId,
      fieldApiNames 
    }: { 
      collectionId: string;
      objectTypeId: string;
      fieldApiNames: string[];
    }) => {
      if (!user || !session) throw new Error('You must be logged in');
      if (!collectionId) throw new Error('Collection ID is required');
      if (!objectTypeId) throw new Error('Object type ID is required');
      if (!fieldApiNames.length) throw new Error('No fields selected');
      
      // Use Edge Function with explicit auth header
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: {
          type: 'addFieldsToCollection',
          collectionId,
          objectTypeId,
          fieldApiNames
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error adding fields:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-fields', collectionId] });
      toast.success('Fields added to collection');
    },
    onError: (error: any) => {
      toast.error('Failed to add fields', {
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
      
      if (error) {
        console.error('Error removing records:', error);
        throw error;
      }
      
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
    isLoading: isLoadingOwned || isLoadingMember,
    error: ownedError || memberError,
    createCollection,
    updateCollection,
    deleteCollection,
    useCollection,
    useCollectionMembers,
    addMember,
    removeMember,
    updateMemberPermission,
    addRecordsToCollection,
    addFieldsToCollection,
    removeRecordsFromCollection
  };
}
