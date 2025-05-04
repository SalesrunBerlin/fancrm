
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Users, Trash2 } from 'lucide-react';
import { CollectionShare } from '@/types/RecordSharing';

export default function CollectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isNewCollectionDialogOpen, setIsNewCollectionDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's collections
  const { data: collections, isLoading } = useQuery({
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
      
      // For each collection, get member count
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
    mutationFn: async () => {
      if (!user) throw new Error('You must be logged in to create collections');
      if (!newCollectionName.trim()) throw new Error('Collection name is required');
      
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('sharing_collections')
        .insert({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          owner_id: user.id
        })
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsNewCollectionDialogOpen(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
      toast.success('Collection created');
      navigate(`/collections/${data.id}`);
    },
    onError: (error: any) => {
      toast.error('Failed to create collection', {
        description: error.message
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
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

  const handleCreateCollection = async () => {
    try {
      await createCollection.mutateAsync();
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sharing Collections"
        description="Manage groups of records that you want to share with other users."
        actions={
          <Button onClick={() => setIsNewCollectionDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card key={collection.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1">{collection.name}</CardTitle>
                {collection.description && (
                  <CardDescription className="line-clamp-2">
                    {collection.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {collection.memberCount} member{collection.memberCount !== 1 ? 's' : ''}
                  </div>
                  <div>
                    {collection.recordCount} record{collection.recordCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" asChild>
                  <a href={`/collections/${collection.id}`}>
                    Manage
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500" 
                  onClick={() => deleteCollection.mutate(collection.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">No collections yet</h3>
            <p className="text-muted-foreground">
              Create a collection to start sharing records with other users
            </p>
            <Button onClick={() => setIsNewCollectionDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Collection
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={isNewCollectionDialogOpen} onOpenChange={setIsNewCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to group records you want to share.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Collection Name
              </label>
              <Input
                id="name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Enter a description for this collection"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCollectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCollection} 
              disabled={!newCollectionName.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
