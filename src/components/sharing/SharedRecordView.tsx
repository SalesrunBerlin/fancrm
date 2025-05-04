
import { useParams } from 'react-router-dom';
import { useObjectFields } from '@/hooks/useObjectFields';
import { RecordViewHeader } from './RecordViewHeader';
import { RecordDataView } from './RecordDataView';
import { RecordLoadingState } from './RecordLoadingState';
import { RecordViewError } from './RecordViewError';
import { RecordNotFound } from './RecordNotFound';
import { useSharedRecordData } from '@/hooks/useSharedRecordData';

export function SharedRecordView() {
  const { recordId } = useParams<{ recordId: string }>();
  const { 
    shareData, 
    recordData, 
    userMappings,
    transformedData, 
    loadingError, 
    isLoading,
    userName
  } = useSharedRecordData(recordId);
  
  // Get the fields of the mapped target object
  const { fields: targetFields } = useObjectFields(
    userMappings.length > 0 ? userMappings[0]?.target_object_id : undefined
  );

  // Handle loading state
  if (isLoading) {
    return <RecordLoadingState />;
  }
  
  // Handle error state
  if (loadingError) {
    return <RecordViewError message={loadingError} />;
  }
  
  // Handle not found state
  if (!shareData || !recordData) {
    return <RecordNotFound />;
  }
  
  return (
    <div className="space-y-6">
      <RecordViewHeader shareId={shareData.id} />
      
      <RecordDataView 
        objectTypeName={recordData.objectTypeName}
        sharedByUserName={userName}
        fields={targetFields || []}
        transformedData={transformedData}
      />
    </div>
  );
}
