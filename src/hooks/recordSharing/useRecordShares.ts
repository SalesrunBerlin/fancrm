
import { useRecordShareQueries } from './useRecordShareQueries';
import { useRecordShareMutations } from './useRecordShareMutations';
import { RecordShare, RecordShareField } from '@/types/RecordSharing';

/**
 * Hook for managing record shares functionality
 */
export function useRecordShares(recordId?: string) {
  // Get queries
  const { 
    shares, 
    shareFields, 
    isLoadingShares,
    isLoadingFields,
    sharesError
  } = useRecordShareQueries(recordId);

  // Get mutations
  const {
    shareRecord,
    updateShare,
    removeShare
  } = useRecordShareMutations(recordId);

  return {
    shares,
    shareFields,
    isLoading: isLoadingShares || isLoadingFields,
    error: sharesError,
    shareRecord,
    updateShare,
    removeShare
  };
}
