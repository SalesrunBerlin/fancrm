import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldMappings } from '@/hooks/useFieldMappings';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useObjectFields } from '@/hooks/useObjectFields';

type ShareByUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  screen_name: string | null;
}

export function SharedRecordView() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mappings, getMappingsForShare } = useFieldMappings();
  const [userMappings, setUserMappings] = useState<any[]>([]);
  
  // Fetch share details (who shared this record with the current user)
  const { data: shareData, isLoading: isLoadingShare } = useQuery({
    queryKey: ['record-share', recordId],
    queryFn: async () => {
      if (!recordId || !user) return null;
      
      console.log('Fetching share details for record:', recordId);
      
      // Use specific column naming in the join to avoid ambiguity
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          shared_by_user:profiles!shared_by_user_id(
            id,
            first_name, 
            last_name, 
            screen_name
          )
        `)
        .eq('record_id', recordId)
        .eq('shared_with_user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching share:', error);
        throw error;
      }
      
      console.log('Share data retrieved:', data);
      return data;
    },
    enabled: !!recordId && !!user
  });
  
  // Get the actual record data
  const { data: recordData, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['shared-record-data', recordId, shareData?.id],
    queryFn: async () => {
      if (!recordId || !shareData) return null;
      
      console.log('Fetching record data for record:', recordId);
      
      // First get the record object type
      const { data: recordDetails, error: recordError } = await supabase
        .from('object_records')
        .select('object_type_id')
        .eq('id', recordId)
        .single();
        
      if (recordError) {
        console.error('Error fetching record details:', recordError);
        throw recordError;
      }
      
      // Then get the values
      const { data: fieldValues, error: valuesError } = await supabase
        .from('object_field_values')
        .select('field_api_name, value')
        .eq('record_id', recordId);
        
      if (valuesError) {
        console.error('Error fetching field values:', valuesError);
        throw valuesError;
      }
      
      // Get visible fields based on record share
      const { data: shareFields } = await supabase
        .from('record_share_fields')
        .select('field_api_name')
        .eq('record_share_id', shareData?.id);
        
      console.log('Record data fetched. Object type:', recordDetails?.object_type_id, 'Field values:', fieldValues?.length);
      
      return {
        objectTypeId: recordDetails.object_type_id,
        fieldValues: fieldValues.reduce((acc, item) => {
          acc[item.field_api_name] = item.value;
          return acc;
        }, {} as Record<string, string>),
        visibleFields: shareFields?.map(f => f.field_api_name) || []
      };
    },
    enabled: !!recordId && !!shareData
  });
  
  // Get the fields of the mapped target object
  const { fields: targetFields } = useObjectFields(
    userMappings.length > 0 ? userMappings[0]?.target_object_id : undefined
  );
  
  useEffect(() => {
    const loadMappings = async () => {
      if (!shareData || !recordData?.objectTypeId) return;
      
      try {
        // Get the source user ID while handling potential undefined values
        const sharedByUser = shareData.shared_by_user as ShareByUser;
        
        if (!sharedByUser || !sharedByUser.id) {
          console.error('Missing shared_by_user information:', shareData);
          toast.error("Cannot determine who shared this record");
          return;
        }

        const sharedById = sharedByUser.id;
        
        console.log('Loading mappings for user:', sharedById, 'and object:', recordData.objectTypeId);

        const mappings = await getMappingsForShare(
          sharedById,
          recordData.objectTypeId
        );
        
        console.log('Mappings loaded:', mappings.length);
        
        if (!mappings.length) {
          // If no mappings found, redirect to mapping page
          console.log('No mappings found, redirecting to mapping configuration');
          navigate(`/field-mapping/${shareData.id}`);
        } else {
          setUserMappings(mappings);
        }
      } catch (error) {
        console.error('Error loading mappings:', error);
        toast.error('Could not load field mappings');
      }
    };
    
    if (shareData && recordData) {
      loadMappings();
    }
  }, [shareData, recordData]);
  
  // Transform record data according to mappings
  const transformedData = userMappings.length > 0 ? 
    Object.entries(recordData?.fieldValues || {}).reduce((acc, [sourceField, value]) => {
      // Find mapping for this source field
      const mapping = userMappings.find(m => m.source_field_api_name === sourceField);
      if (mapping && recordData?.visibleFields.includes(sourceField)) {
        acc[mapping.target_field_api_name] = value;
      }
      return acc;
    }, {} as Record<string, string>) : {};

  if (isLoadingShare || isLoadingRecord) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!shareData || !recordData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Record Not Found</h2>
        <p className="mb-4">The shared record you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link to="/shared-records">Back to Shared Records</Link>
        </Button>
      </div>
    );
  }
  
  // Get the permission level
  const hasEditPermission = shareData.permission_level === 'edit';
  
  // Safely format the user name
  const sharedByUser = shareData.shared_by_user as ShareByUser;
  const userName = sharedByUser 
    ? (sharedByUser.screen_name || 
      `${sharedByUser.first_name || ''} ${sharedByUser.last_name || ''}`.trim() || 
      "Another user")
    : "Another user";
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/shared-records">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shared Records
          </Link>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/field-mapping/${shareData.id}`)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Adjust Field Mappings
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Shared Record View</h2>
          <p className="text-muted-foreground">
            Shared by {userName}
          </p>
        </CardHeader>
        <CardContent>
          {targetFields?.length > 0 ? (
            <div className="space-y-6">
              {targetFields
                .filter(field => Object.keys(transformedData).includes(field.api_name))
                .map(field => (
                  <div key={field.id} className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    <div className="font-medium">{field.name}</div>
                    <div className="lg:col-span-2">
                      {/* Display the value directly as text */}
                      <div className="p-2 border rounded bg-gray-50">
                        {transformedData[field.api_name] || ''}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center py-4">No mapped fields to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
