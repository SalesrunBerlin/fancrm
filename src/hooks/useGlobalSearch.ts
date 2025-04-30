import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useObjectTypes } from '@/hooks/useObjectTypes';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface SearchResult {
  recordId: string;
  objectTypeId: string;
  objectTypeName: string;
  objectIcon: string | null;
  primaryField: string;
  primaryValue: string;
  additionalInfo: string | null;
  lastUpdated: string;
  matchedField?: string;
  matchedValue?: string;
}

export interface GroupedSearchResults {
  objectTypeId: string;
  objectTypeName: string;
  objectIcon: string | null;
  results: SearchResult[];
  totalCount: number;
}

export function useGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { objectTypes } = useObjectTypes();
  const { user } = useAuth();

  // Group results by object type for better display
  const groupedResults = useCallback((): GroupedSearchResults[] => {
    if (!results.length) return [];
    
    const grouped = results.reduce((acc, result) => {
      const existingGroup = acc.find(group => group.objectTypeId === result.objectTypeId);
      
      if (existingGroup) {
        existingGroup.results.push(result);
        existingGroup.totalCount++;
      } else {
        acc.push({
          objectTypeId: result.objectTypeId,
          objectTypeName: result.objectTypeName,
          objectIcon: result.objectIcon,
          results: [result],
          totalCount: 1
        });
      }
      
      return acc;
    }, [] as GroupedSearchResults[]);
    
    // Sort groups by name
    return grouped.sort((a, b) => a.objectTypeName.localeCompare(b.objectTypeName));
  }, [results]);

  // Function to search across all object types
  const searchObjects = useCallback(async (term: string) => {
    if (!term || term.length < 2 || !user) return setResults([]);
    
    try {
      setIsSearching(true);
      const searchableObjects = objectTypes?.filter(obj => obj.is_active) || [];
      
      if (searchableObjects.length === 0) {
        return setResults([]);
      }

      // Fetch records that match the search term across all objects
      const searchPromises = searchableObjects.map(async (objectType) => {
        try {
          // First, get all records from this object type
          const { data: records, error: recordsError } = await supabase
            .from('object_records')
            .select('id, record_id, object_type_id, created_at, updated_at')
            .eq('object_type_id', objectType.id)
            .limit(100);

          if (recordsError) throw recordsError;
          if (!records || records.length === 0) return [];

          // Get all field values for these records
          const recordIds = records.map(record => record.id);
          const { data: fieldValues, error: fieldValuesError } = await supabase
            .from('object_field_values')
            .select('record_id, field_api_name, value')
            .in('record_id', recordIds)
            .ilike('value', `%${term}%`);

          if (fieldValuesError) throw fieldValuesError;
          if (!fieldValues || fieldValues.length === 0) return [];

          // Match field values to records and build search results
          const matchedRecordIds = [...new Set(fieldValues.map(fv => fv.record_id))];
          const matchedRecords = records.filter(r => matchedRecordIds.includes(r.id));
          
          // Group field values by record for easier processing
          const fieldValuesByRecord = fieldValues.reduce((acc, fv) => {
            if (!acc[fv.record_id]) acc[fv.record_id] = [];
            acc[fv.record_id].push(fv);
            return acc;
          }, {} as Record<string, any[]>);
          
          // Determine primary field for this object type
          const defaultFieldApiName = objectType.default_field_api_name || 'name';
          
          // Build search results
          return matchedRecords.map(record => {
            const recordFieldValues = fieldValuesByRecord[record.id] || [];
            
            // Find the primary field value
            const primaryFieldValue = recordFieldValues.find(fv => 
              fv.field_api_name === defaultFieldApiName
            )?.value || 'Unnamed Record';
            
            // Find the field that matched the search term
            const matchedField = recordFieldValues.find(fv => 
              fv.value && fv.value.toString().toLowerCase().includes(term.toLowerCase())
            );

            // Get a secondary field for additional context
            const secondaryField = recordFieldValues.find(fv => 
              fv.field_api_name !== defaultFieldApiName && 
              (!matchedField || fv.field_api_name !== matchedField.field_api_name)
            );
            
            return {
              recordId: record.record_id,
              objectTypeId: objectType.id,
              objectTypeName: objectType.name,
              objectIcon: objectType.icon,
              primaryField: defaultFieldApiName,
              primaryValue: primaryFieldValue,
              additionalInfo: secondaryField?.value?.toString() || null,
              lastUpdated: record.updated_at,
              matchedField: matchedField?.field_api_name,
              matchedValue: matchedField?.value?.toString()
            };
          });
        } catch (error) {
          console.error(`Error searching ${objectType.name}:`, error);
          return [];
        }
      });

      const resultsArrays = await Promise.all(searchPromises);
      const allResults = resultsArrays.flat();
      
      // Sort by relevance (prioritize matches in primary fields)
      const sortedResults = allResults.sort((a, b) => {
        // Primary field matches get higher priority
        const aPrimaryMatch = a.matchedField === a.primaryField;
        const bPrimaryMatch = b.matchedField === b.primaryField;
        
        if (aPrimaryMatch && !bPrimaryMatch) return -1;
        if (!aPrimaryMatch && bPrimaryMatch) return 1;
        
        // Otherwise sort by most recently updated
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
      
      setResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Suchfehler",
        description: "Bei der Suche ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user, objectTypes]);

  // Execute search when the debounced term changes
  useEffect(() => {
    searchObjects(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchObjects]);

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    results,
    groupedResults: groupedResults(),
  };
}
