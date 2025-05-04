
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface AddToCollectionButtonProps {
  recordId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function AddToCollectionButton({
  recordId,
  variant = "outline"
}: AddToCollectionButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's collections
  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections-for-record', recordId],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('sharing_collections')
        .select('*')
        .eq('owner_id', user.id);
      
      if (error) {
        console.error('Error fetching collections:', error);
        throw error;
      }
      
      // Check which collections already contain this record
      const collectionsWithStatus = await Promise.all((data || []).map(async (collection) => {
        const { count } = await supabase
          .from('collection_records')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id)
          .eq('record_id', recordId);
        
        return {
          ...collection,
          isIncluded: count && count > 0
        };
      }));
      
      return collectionsWithStatus;
    },
    enabled: !!user && !!recordId,
  });
  
  // Add record to collection
  const addToCollection = useMutation({
    mutationFn: async () => {
      if (!user || !recordId || !selectedCollectionId) {
        throw new Error('Missing required data');
      }
      
      setIsSubmitting(true);
      
      // Check if record is already in collection
      const { count, error: checkError } = await supabase
        .from('collection_records')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', selectedCollectionId)
        .eq('record_id', recordId);
      
      if (checkError) throw checkError;
      
      // If record is already in collection, do nothing
      if (count && count > 0) {
        return { alreadyExists: true };
      }
      
      // Add record to collection
      const { data, error } = await supabase
        .from('collection_records')
        .insert({
          collection_id: selectedCollectionId,
          record_id: recordId
        })
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['collections-for-record', recordId] });
      
      if (result && 'alreadyExists' in result && result.alreadyExists) {
        toast.info('Record already exists in this collection');
      } else {
        toast.success('Record added to collection');
      }
      
      setIsDialogOpen(false);
      setSelectedCollectionId(null);
    },
    onError: (error: any) => {
      toast.error('Failed to add record to collection', {
        description: error.message
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  const handleAddToCollection = async () => {
    try {
      await addToCollection.mutateAsync();
    } catch (error) {
      console.error('Error adding to collection:', error);
    }
  };

  return (
    <>
      <Button 
        variant={variant}
        onClick={() => setIsDialogOpen(true)} 
        className="flex items-center gap-2"
      >
        <FolderPlus className="h-4 w-4" />
        Add to Collection
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
            <DialogDescription>
              Select a collection to add this record to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : collections && collections.length > 0 ? (
              <RadioGroup 
                value={selectedCollectionId || ''} 
                onValueChange={setSelectedCollectionId}
              >
                <div className="space-y-4">
                  {collections.map((collection: any) => (
                    <div 
                      key={collection.id} 
                      className={`flex items-center space-x-3 rounded-md border p-3 ${collection.isIncluded ? 'bg-muted' : ''}`}
                    >
                      <RadioGroupItem 
                        value={collection.id} 
                        id={`collection-${collection.id}`}
                        disabled={collection.isIncluded}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`collection-${collection.id}`} 
                          className={`font-medium ${collection.isIncluded ? 'text-muted-foreground' : ''}`}
                        >
                          {collection.name}
                        </Label>
                        {collection.description && (
                          <p className={`text-sm ${collection.isIncluded ? 'text-muted-foreground' : 'text-gray-500'}`}>
                            {collection.description}
                          </p>
                        )}
                        {collection.isIncluded && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Already in this collection
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <div className="text-center py-6 space-y-4">
                <p>You don't have any collections yet.</p>
                <Button asChild variant="outline">
                  <Link to="/collections">Create a Collection</Link>
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToCollection} 
              disabled={!selectedCollectionId || isSubmitting || !collections?.some((c: any) => c.id === selectedCollectionId && !c.isIncluded)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
