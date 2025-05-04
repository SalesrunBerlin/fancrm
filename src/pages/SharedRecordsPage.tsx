
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

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  screen_name: string | null;
}

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
      
      console.log('Fetching records shared with me');
      
      // Use explicit join with specific column names
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          shared_by_user:profiles!shared_by_user_id(
            id, 
            first_name, 
            last_name, 
            avatar_url, 
            screen_name
          )
        `)
        .eq('shared_with_user_id', user.id);
        
      if (error) {
        console.error('Error fetching shared records:', error);
        throw error;
      }
      
      console.log('Records shared with me:', data?.length);
      return data || [];
    },
    enabled: !!user
  });
  
  // Fetch records that the current user has shared with others
  const { data: mySharedRecords, isLoading: isLoadingMyShares } = useQuery({
    queryKey: ['my-shares'],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching my shared records');
      
      // Use explicit join with specific column names
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          shared_with_user:profiles!shared_with_user_id(
            id, 
            first_name, 
            last_name, 
            avatar_url, 
            screen_name
          )
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
      
      console.log('My shared records:', enhancedData?.length);
      return enhancedData;
    },
    enabled: !!user && activeTab === 'my-shares'
  });
  
  // Check mapping status for all shared records
  useEffect(() => {
    const checkMappingStatuses = async () => {
      if (!sharedWithMeRecords?.length || !user) return;
      
      console.log('Checking mapping statuses for shared records');
      
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
          
          // Get the shared by user ID safely
          const sharedByUser = share.shared_by_user as UserProfile;
          
          if (!sharedByUser || !sharedByUser.id) {
            console.error('Missing shared_by_user information:', share);
            return [share.id, { isConfigured: false, percentage: 0 }];
          }
          
          // Check mappings status for this share
          const status = await getMappingStatus(
            sharedByUser.id,
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
      console.log('Mapping statuses updated');
    };
    
    if (activeTab === 'shared-with-me') {
      checkMappingStatuses();
    }
  }, [sharedWithMeRecords, user, activeTab]);
  
  // Format user display name
  const formatUserName = (userProfile: any) => {
    if (!userProfile) return 'Unknown User';
    
    // Handle case when userProfile is not available
    if (!userProfile || typeof userProfile !== 'object') return 'Unknown User';
    
    if (userProfile.screen_name) return userProfile.screen_name;
    
    const firstName = userProfile.first_name || '';
    const lastName = userProfile.last_name || '';
    
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User';
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Freigaben"
        description="Sehen Sie Datensätze, die mit Ihnen geteilt wurden, oder die Sie mit anderen geteilt haben."
      />
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shared-with-me">Mit mir geteilt</TabsTrigger>
          <TabsTrigger value="my-shares">Meine Freigaben</TabsTrigger>
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
                      <CardTitle className="text-lg">Geteilt von {formatUserName(share.shared_by_user)}</CardTitle>
                      {mappingStatuses[share.id] && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={mappingStatuses[share.id].isConfigured ? "success" : "outline"}>
                                {mappingStatuses[share.id].isConfigured 
                                  ? `Zugeordnet (${mappingStatuses[share.id].percentage}%)`
                                  : "Zuordnung erforderlich"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {mappingStatuses[share.id].isConfigured 
                                ? `${mappingStatuses[share.id].percentage}% der Felder sind zugeordnet`
                                : "Sie müssen Felder zuordnen, bevor Sie diesen Datensatz anzeigen können"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Berechtigung: {share.permission_level === 'read' ? 'Nur Lesen' : 'Bearbeiten'}</p>
                      <p>Geteilt am: {new Date(share.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {mappingStatuses[share.id]?.isConfigured ? (
                      <Button variant="outline" asChild className="flex-1">
                        <Link to={`/shared-record/${share.record_id}`} className="flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Datensatz anzeigen
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" asChild className="flex-1">
                        <Link to={`/field-mapping/${share.id}`} className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Feldzuordnung konfigurieren
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
                <CardTitle>Keine geteilten Datensätze</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Es wurden noch keine Datensätze mit Ihnen geteilt.
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
                      Geteilt mit {formatUserName(share.shared_with_user)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Datensatztyp: {(share as any).objectTypeName || 'Datensatz'}</p>
                      <p>Berechtigung: {share.permission_level === 'read' ? 'Nur Lesen' : 'Bearbeiten'}</p>
                      <p>Geteilt am: {new Date(share.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                      <Link to={`/objects/${share.record_id}`} className="flex items-center">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Datensatz anzeigen
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Keine geteilten Datensätze</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sie haben noch keine Datensätze mit anderen geteilt.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
