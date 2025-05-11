
import { useState } from 'react';
import { useFieldPicklistValues } from './useFieldPicklistValues';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Array of default colors for picklist values
const defaultColors = [
  "#8B5CF6", // Purple
  "#D946EF", // Magenta
  "#EC4899", // Pink
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#A855F7"  // Violet
];

export function usePicklistCreation(fieldId: string | null) {
  const [isAddingValues, setIsAddingValues] = useState(false);
  const { addValue, removeValue, refetch } = useFieldPicklistValues(fieldId || '');
  const { user } = useAuth();
  
  // Function to get a color for a new picklist value 
  const getNextColor = (existingValues: number) => {
    // Use the index to select a color, cycle through if we have more values than colors
    const colorIndex = existingValues % defaultColors.length;
    return defaultColors[colorIndex];
  };

  const addPicklistValue = async (value: string) => {
    if (!fieldId) return false;
    if (!user) {
      toast.error('You must be logged in to add picklist values');
      return false;
    }
    
    setIsAddingValues(true);
    try {
      // Get current count to determine a color
      const { data: existingValues } = await supabase
        .from('field_picklist_values')
        .select('id')
        .eq('field_id', fieldId);
      
      const count = existingValues?.length || 0;
      const color = getNextColor(count);
      
      await addValue.mutateAsync({
        value: value.trim(),
        label: value.trim(),
        color // Add a color to new picklist values
      });
      return true;
    } catch (error) {
      console.error('Error adding picklist value:', error);
      toast.error('Failed to add picklist value');
      return false;
    } finally {
      setIsAddingValues(false);
    }
  };

  const addBatchPicklistValues = async (targetFieldId: string | null = null, values: string[] = []) => {
    // Use the provided fieldId or fall back to the hook's fieldId
    const fieldToUse = targetFieldId || fieldId;
    
    if (!fieldToUse || values.length === 0) return false;
    if (!user) {
      toast.error('You must be logged in to add picklist values');
      return false;
    }
    
    setIsAddingValues(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      console.log(`Adding ${values.length} picklist values to field ${fieldToUse}`);
      
      // Unique values only (just in case)
      const uniqueValues = Array.from(new Set(values.filter(v => v.trim() !== '')));
      
      // Get current count to determine starting color
      const { data: existingValues } = await supabase
        .from('field_picklist_values')
        .select('id')
        .eq('field_id', fieldToUse);
      
      const startIndex = existingValues?.length || 0;
      
      // Create batch of picklist value objects for insertion
      const picklistValueObjects = uniqueValues.map((value, index) => ({
        field_id: fieldToUse,
        value: value.trim(),
        label: value.trim(),
        owner_id: user.id,
        color: getNextColor(startIndex + index) // Assign a color based on position
      }));
      
      console.log('Inserting picklist values with owner_id:', user.id);
      
      // Insert in batches of 20 to avoid potential limitations
      const batchSize = 20;
      for (let i = 0; i < picklistValueObjects.length; i += batchSize) {
        const batch = picklistValueObjects.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('field_picklist_values')
          .insert(batch)
          .select();
        
        if (error) {
          console.error("Error inserting picklist batch:", error);
          errorCount += batch.length;
        } else {
          successCount += data.length;
        }
      }
      
      // Refresh the picklist values if we're using the current field
      if (fieldToUse === fieldId) {
        await refetch();
      }
      
      console.log(`Batch picklist creation results - Success: ${successCount}, Errors: ${errorCount}`);
      
      if (errorCount > 0) {
        if (errorCount === picklistValueObjects.length) {
          toast.error('Failed to add any picklist values. Please check your permissions.');
        } else {
          toast.warning(`Added ${successCount} values, but ${errorCount} failed.`);
        }
        return successCount > 0;
      }
      
      return errorCount === 0; // Return true only if all values were added successfully
    } catch (error) {
      console.error('Error in batch picklist creation:', error);
      toast.error('Failed to add picklist values');
      return false;
    } finally {
      setIsAddingValues(false);
    }
  };

  const removePicklistValue = async (valueId: string) => {
    if (!fieldId) return false;
    
    try {
      await removeValue.mutateAsync(valueId);
      return true;
    } catch (error) {
      console.error('Error removing picklist value:', error);
      toast.error('Failed to remove picklist value');
      return false;
    }
  };

  return {
    isAddingValues,
    addPicklistValue,
    addBatchPicklistValues,
    removePicklistValue,
  };
}
