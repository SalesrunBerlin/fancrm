
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldMappings } from '@/hooks/useFieldMappings';

type ShareByUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  screen_name: string | null;
}

export function useSharedRecordData(recordId: string | undefined) {
  const { user } = useAuth();
  const { getMappingsForShare } = useFieldMappings();
  const [userMappings, setUserMappings] = useState<any[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Fetch share details (who shared this record with the current user)
  const { data: shareData, isLoading: isLoadingShare } = useQuery({
    queryKey: ['record-share', recordId],
    queryFn: async () => {
      if (!recordId || !user) return null;
      
      console.log('Fetching share details for record:', recordId);
      
      try {
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
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching share:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('Freigabe nicht gefunden');
        }
        
        console.log('Share data retrieved:', data);
        return data;
      } catch (error) {
        console.error('Error in share query:', error);
        setLoadingError(error instanceof Error ? error.message : "Fehler beim Laden der Freigabedaten");
        return null;
      }
    },
    enabled: !!recordId && !!user
  });
  
  // Get the actual record data
  const { data: recordData, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['shared-record-data', recordId, shareData?.id],
    queryFn: async () => {
      if (!recordId || !shareData) return null;
      
      console.log('Fetching record data for record:', recordId);
      
      try {
        // First get the record object type
        const { data: recordDetails, error: recordError } = await supabase
          .from('object_records')
          .select('object_type_id')
          .eq('id', recordId)
          .maybeSingle();
          
        if (recordError) {
          console.error('Error fetching record details:', recordError);
          throw recordError;
        }
        
        if (!recordDetails) {
          throw new Error('Datensatz nicht gefunden');
        }
        
        // Get object type information
        const { data: objectTypeData, error: objectTypeError } = await supabase
          .from('object_types')
          .select('name, api_name')
          .eq('id', recordDetails.object_type_id)
          .maybeSingle();
          
        if (objectTypeError) {
          console.error('Error fetching object type:', objectTypeError);
          throw objectTypeError;
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
          objectTypeName: objectTypeData?.name || 'Unbekanntes Objekt',
          objectTypeApiName: objectTypeData?.api_name || '',
          fieldValues: fieldValues.reduce((acc, item) => {
            acc[item.field_api_name] = item.value;
            return acc;
          }, {} as Record<string, string>),
          visibleFields: shareFields?.map(f => f.field_api_name) || []
        };
      } catch (error) {
        console.error('Error in record data query:', error);
        setLoadingError(error instanceof Error ? error.message : "Fehler beim Laden der Daten");
        return null;
      }
    },
    enabled: !!recordId && !!shareData
  });

  // Load field mappings
  useEffect(() => {
    const loadMappings = async () => {
      if (!shareData || !recordData?.objectTypeId) return;
      
      try {
        // Get the source user ID while handling potential undefined values
        const sharedByUser = shareData.shared_by_user as ShareByUser;
        
        if (!sharedByUser || !sharedByUser.id) {
          console.error('Missing shared_by_user information:', shareData);
          setLoadingError("Die Benutzerinformationen konnten nicht ermittelt werden");
          return;
        }

        const sharedById = sharedByUser.id;
        
        console.log('Loading mappings for user:', sharedById, 'and object:', recordData.objectTypeId);

        const mappings = await getMappingsForShare(
          sharedById,
          recordData.objectTypeId
        );
        
        console.log('Mappings loaded:', mappings.length);
        
        if (mappings.length === 0) {
          setLoadingError("Keine Feldzuordnungen gefunden. Bitte konfigurieren Sie die Feldzuordnungen für diesen Datensatz.");
          return;
        }
        
        setUserMappings(mappings);
      } catch (error) {
        console.error('Error loading mappings:', error);
        setLoadingError(error instanceof Error ? error.message : "Fehler beim Laden der Feldzuordnungen");
      }
    };
    
    if (shareData && recordData) {
      loadMappings();
    }
  }, [shareData, recordData, getMappingsForShare]);

  // Prepare the user's name
  const getUserName = () => {
    const sharedByUser = shareData?.shared_by_user as ShareByUser | undefined;
    return sharedByUser 
      ? (sharedByUser.screen_name || 
        `${sharedByUser.first_name || ''} ${sharedByUser.last_name || ''}`.trim() || 
        "Anderer Benutzer")
      : "Anderer Benutzer";
  };

  // Transform record data according to mappings
  const transformedData = userMappings.length > 0 && recordData?.fieldValues ? 
    Object.entries(recordData.fieldValues).reduce((acc, [sourceField, value]) => {
      // Find mapping for this source field
      const mapping = userMappings.find(m => m.source_field_api_name === sourceField);
      if (mapping && recordData?.visibleFields.includes(sourceField)) {
        acc[mapping.target_field_api_name] = value;
      }
      return acc;
    }, {} as Record<string, string>) : {};

  return {
    shareData,
    recordData,
    userMappings,
    transformedData,
    loadingError,
    isLoading: isLoadingShare || isLoadingRecord,
    userName: getUserName(),
    hasEditPermission: shareData?.permission_level === 'edit'
  };
}
