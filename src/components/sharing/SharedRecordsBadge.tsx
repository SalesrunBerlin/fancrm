
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Share2 } from 'lucide-react';

interface SharedRecordsBadgeProps {
  recordId: string;
}

export function SharedRecordsBadge({ recordId }: SharedRecordsBadgeProps) {
  const { user } = useAuth();
  
  const { data: shareCount } = useQuery({
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
  
  if (!shareCount || shareCount === 0) {
    return null;
  }
  
  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Share2 className="h-3 w-3" />
      Shared ({shareCount})
    </Badge>
  );
}
