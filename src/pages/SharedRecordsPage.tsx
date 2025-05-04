
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SharedRecordsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shared-with-me');
  
  // Fetch records shared with the current user
  const { data: sharedRecords, isLoading: isLoadingShared } = useQuery({
    queryKey: ['shared-with-me'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('shared_records')
        .select('*')
        .eq('shared_with_user_id', user.id);
        
      if (error) {
        console.error('Error fetching shared records:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared Records"
        description="View records that have been shared with you or that you have shared with others."
      />
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shared-with-me">Shared with me</TabsTrigger>
          <TabsTrigger value="my-shares">My shares</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared-with-me" className="space-y-4">
          {isLoadingShared ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : sharedRecords && sharedRecords.length > 0 ? (
            <div className="grid gap-4">
              {/* Display shared records here */}
              <p>Records shared with you will appear here</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No shared records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No one has shared any records with you yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="my-shares" className="space-y-4">
          {/* Display records that the current user has shared */}
          <Card>
            <CardHeader>
              <CardTitle>My Shared Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Records you've shared will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
