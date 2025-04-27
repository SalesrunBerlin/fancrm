
import { useState } from 'react';
import { useFieldPicklistValues } from './useFieldPicklistValues';
import { toast } from 'sonner';

export function usePicklistCreation(fieldId: string | null) {
  const [isAddingValues, setIsAddingValues] = useState(false);
  const { addValue, removeValue } = useFieldPicklistValues(fieldId || '');

  const addPicklistValue = async (value: string) => {
    if (!fieldId) return false;
    
    setIsAddingValues(true);
    try {
      await addValue.mutateAsync({
        value: value.trim(),
        label: value.trim(),
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

  const addBatchPicklistValues = async (values: string[]) => {
    if (!fieldId || values.length === 0) return false;
    
    setIsAddingValues(true);
    try {
      // Process one by one to avoid race conditions
      for (const value of values) {
        await addValue.mutateAsync({
          value: value.trim(),
          label: value.trim(),
        });
      }
      return true;
    } catch (error) {
      console.error('Error adding picklist values in batch:', error);
      toast.error('Failed to add some picklist values');
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
