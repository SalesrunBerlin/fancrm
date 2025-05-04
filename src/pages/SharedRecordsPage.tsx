
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecordShare } from '@/types/RecordSharing';
import { useFieldMappings } from '@/hooks/useFieldMappings';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SharedRecordsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shared-with-me');
  const { getMappingStatus } = useFieldMappings();
  const [mappingStatuses, setMappingStatuses] = useState<Record<string, { isConfigured: boolean, percentage: number }>>({});
  
  // Fetch records shared with the current user
  const { data: sharedWithMeRecords, isLoading: isLoadingShared } = useQuery({
    queryKey: ['shared-with-me'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          user_profile:profiles!record_shares_shared_by_user_id_fkey(id, first_name, last_name, avatar_url, screen_name)
        `)
        .eq('shared_with_user_id', user.id);
        
      if (error) {
        console.error('Error fetching shared records:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });
  
  // Fetch records that the current user has shared with others
  const { data: mySharedRecords, isLoading: isLoadingMyShares } = useQuery({
    queryKey: ['my-shares'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          user_profile:profiles!record_shares_shared_with_user_id_fkey(id, first_name, last_name, avatar_url, screen_name)
        `)
        .eq('shared_by_user_id', user.id);
        
      if (error) {
        console.error('Error fetching my shared records:', error);
        throw error;
      }
      
      // For each record, fetch the object type name
      const enhancedData = await Promise.all((data || []).map(async (share) => {
        if (!share.record_id) return share;
        
        // Get the object record
        const { data: recordData } = await supabase
          .from('object_records')
          .select('object_type_id')
          .eq('id', share.record_id)
          .single();
          
        if (!recordData) return share;
        
        // Get the object type name
        const { data: objectTypeData } = await supabase
          .from('object_types')
          .select('name')
          .eq('id', recordData.object_type_id)
          .single();
          
        return {
          ...share,
          objectTypeName: objectTypeData?.name || 'Unknown'
        };
      }));
      
      return enhancedData;
    },
    enabled: !!user && activeTab === 'my-shares'
  });
  
  // Check mapping status for all shared records
  useEffect(() => {
    const checkMappingStatuses = async () => {
      if (!sharedWithMeRecords?.length || !user) return;
      
      const statusPromises = sharedWithMeRecords.map(async (share) => {
        try {
          // Get record object type and fields
          const { data: recordData } = await supabase
            .from('object_records')
            .select('object_type_id')
            .eq('id', share.record_id)
            .single();
            
          if (!recordData) return [share.id, { isConfigured: false, percentage: 0 }];
          
          // Get shared fields
          const { data: sharedFields } = await supabase
            .from('record_share_fields')
            .select('field_api_name')
            .eq('record_share_id', share.id);
            
          if (!sharedFields?.length) return [share.id, { isConfigured: false, percentage: 0 }];
          
          // Check mappings status for this share
          const status = await getMappingStatus(
            share.shared_by_user_id,
            recordData.object_type_id,
            sharedFields.map(f => f.field_api_name)
          );
          
          return [share.id, { 
            isConfigured: status.isConfigured,
            percentage: status.totalFields > 0 
              ? Math.round((status.mappedFields / status.totalFields) * 100) 
              : 0
          }];
        } catch (err) {
          console.error('Error checking mapping status:', err);
          return [share.id, { isConfigured: false, percentage: 0 }];
        }
      });
      
      const statuses = await Promise.all(statusPromises);
      setMappingStatuses(Object.fromEntries(statuses));
    };
    
    if (activeTab === 'shared-with-me') {
      checkMappingStatuses();
    }
  }, [sharedWithMeRecords, user, activeTab]);
  
  // Format user display name
  const formatUserName = (userProfile: RecordShare['user_profile']) => {
    if (!userProfile) return 'Unknown User';
    
    if (userProfile.screen_name) return userProfile.screen_name;
    
    const firstName = userProfile.first_name || '';
    const lastName = userProfile.last_name || '';
    
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User';
  };
  
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
          ) : sharedWithMeRecords && sharedWithMeRecords.length > 0 ? (
            <div className="grid gap-4">
              {sharedWithMeRecords.map((share) => (
                <Card key={share.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Shared by {formatUserName(share.user_profile)}</CardTitle>
                      {mappingStatuses[share.id] && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={mappingStatuses[share.id].isConfigured ? "success" : "outline"}>
                                {mappingStatuses[share.id].isConfigured 
                                  ? `Mapped (${mappingStatuses[share.id].percentage}%)`
                                  : "Needs mapping"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {mappingStatuses[share.id].isConfigured 
                                ? `${mappingStatuses[share.id].percentage}% of fields are mapped`
                                : "You need to map fields before viewing this record"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Permission: {share.permission_level === 'read' ? 'Read only' : 'Edit'}</p>
                      <p>Shared on: {new Date(share.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {mappingStatuses[share.id]?.isConfigured ? (
                      <Button variant="outline" asChild className="flex-1">
                        <Link to={`/shared-record/${share.record_id}`} className="flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Record
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" asChild className="flex-1">
                        <Link to={`/field-mapping/${share.id}`} className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure Mapping
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
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
          {isLoadingMyShares ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : mySharedRecords && mySharedRecords.length > 0 ? (
            <div className="grid gap-4">
              {mySharedRecords.map((share) => (
                <Card key={share.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Shared with {formatUserName(share.user_profile)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Record type: {(share as any).objectTypeName || 'Record'}</p>
                      <p>Permission: {share.permission_level === 'read' ? 'Read only' : 'Edit'}</p>
                      <p>Shared on: {new Date(share.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                      <Link to={`/records/${share.record_id}`} className="flex items-center">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Record
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No shared records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You haven't shared any records with others yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
