
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

      console.log("Searching for term:", term);
      console.log("Searching in objects:", searchableObjects.map(obj => obj.name));

      // Fetch records that match the search term across all objects
      const searchPromises = searchableObjects.map(async (objectType) => {
        try {
          // First, query object_field_values directly with search term
          const { data: matchedFieldValues, error: fieldValueError } = await supabase
            .from('object_field_values')
            .select('record_id, field_api_name, value')
            .ilike('value', `%${term}%`);

          if (fieldValueError) {
            console.error(`Error searching field values for ${objectType.name}:`, fieldValueError);
            return [];
          }

          console.log(`Found ${matchedFieldValues?.length || 0} field value matches for ${objectType.name}`);
          
          if (!matchedFieldValues || matchedFieldValues.length === 0) return [];
          
          // Get the record IDs from matching field values
          const matchedRecordIds = [...new Set(matchedFieldValues.map(fv => fv.record_id))];
          
          // Now get full records information for these record IDs that belong to this object type
          const { data: objectRecords, error: recordsError } = await supabase
            .from('object_records')
            .select('id, record_id, object_type_id, created_at, updated_at')
            .in('id', matchedRecordIds)
            .eq('object_type_id', objectType.id);

          if (recordsError) {
            console.error(`Error fetching object records for ${objectType.name}:`, recordsError);
            return [];
          }
          
          if (!objectRecords || objectRecords.length === 0) return [];
          
          console.log(`Found ${objectRecords.length} matching records for ${objectType.name}`);
          
          // Map field values to records
          const recordFieldValueMap = matchedFieldValues.reduce((acc, fv) => {
            if (!acc[fv.record_id]) acc[fv.record_id] = [];
            acc[fv.record_id].push(fv);
            return acc;
          }, {} as Record<string, typeof matchedFieldValues>);
          
          // Determine primary field for this object type
          const defaultFieldApiName = objectType.default_field_api_name || 'name';
          
          // Fetch all needed field values for the matched records
          const { data: allFieldValues, error: allFieldsError } = await supabase
            .from('object_field_values')
            .select('record_id, field_api_name, value')
            .in('record_id', objectRecords.map(record => record.id));
            
          if (allFieldsError) {
            console.error(`Error fetching all field values for ${objectType.name}:`, allFieldsError);
            return [];
          }
          
          // Group all field values by record
          const allFieldsByRecord = allFieldValues?.reduce((acc, fv) => {
            if (!acc[fv.record_id]) acc[fv.record_id] = [];
            acc[fv.record_id].push(fv);
            return acc;
          }, {} as Record<string, typeof allFieldValues>) || {};
          
          // Build search results
          return objectRecords.map(record => {
            const matchedFields = recordFieldValueMap[record.id] || [];
            const allFields = allFieldsByRecord[record.id] || [];
            
            // Find the primary field value
            const primaryField = allFields.find(fv => fv.field_api_name === defaultFieldApiName);
            const primaryValue = primaryField?.value || 'Unnamed Record';
            
            // Find the field that matched the search term
            const matchedField = matchedFields.find(fv => 
              fv.value && fv.value.toString().toLowerCase().includes(term.toLowerCase())
            );
            
            // Get a secondary field for additional context
            const secondaryField = allFields.find(fv => 
              fv.field_api_name !== defaultFieldApiName && 
              (!matchedField || fv.field_api_name !== matchedField.field_api_name)
            );
            
            return {
              recordId: record.record_id,
              objectTypeId: objectType.id,
              objectTypeName: objectType.name,
              objectIcon: objectType.icon,
              primaryField: defaultFieldApiName,
              primaryValue: primaryValue,
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
      
      console.log(`Total search results: ${allResults.length}`);
      
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
