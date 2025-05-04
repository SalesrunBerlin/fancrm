
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Share2, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SharedRecordsBadgeProps {
  recordId: string;
}

export function SharedRecordsBadge({ recordId }: SharedRecordsBadgeProps) {
  const { user } = useAuth();
  
  // Get direct share count
  const { data: directShareCount } = useQuery({
    queryKey: ['record-share-count', recordId],
    queryFn: async (): Promise<number> => {
      if (!user || !recordId) return 0;
      
      const { count, error } = await supabase
        .from('record_shares')
        .select('*', { count: 'exact', head: true })
        .eq('record_id', recordId)
        .eq('shared_by_user_id', user.id);
      
      if (error) {
        console.error('Error fetching share count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && !!recordId
  });
  
  // Get collection share count
  const { data: collectionShareCount } = useQuery({
    queryKey: ['record-collection-count', recordId],
    queryFn: async (): Promise<number> => {
      if (!user || !recordId) return 0;
      
      const { count, error } = await supabase
        .from('collection_records')
        .select(`
          id,
          collection_id,
          record_id
        `, { count: 'exact', head: true })
        .eq('record_id', recordId)
        .in('collection_id', supabase
          .from('sharing_collections')
          .select('id')
          .eq('owner_id', user.id)
        );
      
      if (error) {
        console.error('Error fetching collection count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && !!recordId
  });
  
  // If nothing is shared, don't show the badge
  if ((!directShareCount || directShareCount === 0) && 
      (!collectionShareCount || collectionShareCount === 0)) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex space-x-2">
            {directShareCount && directShareCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                Shared ({directShareCount})
              </Badge>
            )}
            
            {collectionShareCount && collectionShareCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                In Collections ({collectionShareCount})
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {directShareCount && directShareCount > 0 && 
              `Directly shared with ${directShareCount} user${directShareCount !== 1 ? 's' : ''}`}
            {directShareCount && directShareCount > 0 && collectionShareCount && collectionShareCount > 0 && 
              ` and `}
            {collectionShareCount && collectionShareCount > 0 && 
              `added to ${collectionShareCount} collection${collectionShareCount !== 1 ? 's' : ''}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
