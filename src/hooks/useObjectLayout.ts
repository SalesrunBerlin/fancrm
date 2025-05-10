import { useCallback, useMemo } from "react";
import { useObjectLayouts } from "./useObjectLayouts";
import { useLayoutFields } from "./useLayoutFields";
import { ObjectField } from "@/types/ObjectFieldTypes";

export function useObjectLayout(
  objectTypeId: string | undefined,
  selectedLayoutId?: string
) {
  // Get available layouts for this object
  const { layouts, isLoading: isLayoutsLoading, getDefaultLayout } = useObjectLayouts(objectTypeId);
  
  // Determine which layout to use - selected, default, or first
  const layoutId = useMemo(() => {
    if (selectedLayoutId) {
      return selectedLayoutId;
    }
    
    if (!layouts || layouts.length === 0) {
      return undefined;
    }
    
    // Try to get the default layout
    const defaultLayout = getDefaultLayout();
    if (defaultLayout) {
      return defaultLayout.id;
    }
    
    // Fallback to the first layout
    return layouts[0].id;
  }, [selectedLayoutId, layouts, getDefaultLayout]);
  
  // Get layout fields for the active layout
  const { 
    layoutFields, 
    isLoading: isLayoutFieldsLoading 
  } = useLayoutFields(layoutId, true);
  
  const isLoading = isLayoutsLoading || isLayoutFieldsLoading;
  
  // Apply the layout configuration to the fields
  const applyLayout = useCallback((fields: ObjectField[]): ObjectField[] => {
    if (!layoutFields || layoutFields.length === 0 || !fields || fields.length === 0) {
      return fields;
    }
    
    // Create a map of field id to layout field info for quick lookup
    const layoutFieldMap = new Map(
      layoutFields.map(layoutField => [layoutField.field_id, layoutField])
    );
    
    // Filter and sort fields according to the layout configuration
    return fields
      .filter(field => {
        // If there's no layout config for this field, keep it
        if (!layoutFieldMap.has(field.id)) {
          return true;
        }
        
        // If there's a layout config, check if the field should be visible
        const layoutField = layoutFieldMap.get(field.id);
        return layoutField?.is_visible !== false;
      })
      .sort((a, b) => {
        // Get the display order from layout if available
        const aOrder = layoutFieldMap.has(a.id) 
          ? layoutFieldMap.get(a.id)?.display_order || a.display_order 
          : a.display_order;
          
        const bOrder = layoutFieldMap.has(b.id) 
          ? layoutFieldMap.get(b.id)?.display_order || b.display_order 
          : b.display_order;
          
        return aOrder - bOrder;
      });
  }, [layoutFields]);
  
  return {
    applyLayout,
    isLoading,
    activeLayoutId: layoutId
  };
}
