import { useEffect, useState } from "react";
import { useObjectLayouts } from "@/hooks/useObjectLayouts";
import { useLayoutFields } from "@/hooks/useLayoutFields";
import { ObjectField } from "@/types/ObjectFieldTypes";

interface LayoutFieldConfig {
  fieldId: string;
  displayOrder: number;
  isVisible: boolean;
}

export function useObjectLayout(objectTypeId?: string) {
  const { layouts, isLoading: isLoadingLayouts, getDefaultLayout } = useObjectLayouts(objectTypeId);
  const [layoutId, setLayoutId] = useState<string | undefined>(undefined);
  const [fieldConfigs, setFieldConfigs] = useState<Map<string, LayoutFieldConfig>>(new Map());

  // Get layout fields for the default/active layout
  const { 
    layoutFields, 
    isLoading: isLoadingLayoutFields 
  } = useLayoutFields(layoutId);

  // Find and set the default layout when layouts are loaded
  useEffect(() => {
    if (layouts && layouts.length > 0) {
      const defaultLayout = getDefaultLayout();
      if (defaultLayout) {
        setLayoutId(defaultLayout.id);
      }
    } else {
      setLayoutId(undefined);
    }
  }, [layouts, getDefaultLayout]);

  // Update field configs when layout fields change
  useEffect(() => {
    if (layoutFields) {
      const configs = new Map<string, LayoutFieldConfig>();
      
      layoutFields.forEach(layoutField => {
        configs.set(layoutField.field_id, {
          fieldId: layoutField.field_id,
          displayOrder: layoutField.display_order,
          isVisible: layoutField.is_visible
        });
      });
      
      setFieldConfigs(configs);
    }
  }, [layoutFields]);

  /**
   * Apply layout configuration to the fields
   */
  const applyLayout = (fields: ObjectField[]): ObjectField[] => {
    if (!layoutId || fieldConfigs.size === 0) {
      // If no layout is found, return fields in their natural order
      return [...fields].sort((a, b) => a.display_order - b.display_order);
    }

    // Filter and sort fields according to layout configuration
    return [...fields]
      .filter(field => {
        const config = fieldConfigs.get(field.id);
        // Show field if it's not in the layout or if it's visible in the layout
        return !config || config.isVisible;
      })
      .sort((a, b) => {
        const configA = fieldConfigs.get(a.id);
        const configB = fieldConfigs.get(b.id);
        
        // If fields are in the layout, use layout order
        if (configA && configB) {
          return configA.displayOrder - configB.displayOrder;
        }
        
        // If only one field is in the layout, prioritize it
        if (configA) return -1;
        if (configB) return 1;
        
        // Otherwise, fall back to regular field order
        return a.display_order - b.display_order;
      });
  };

  return {
    applyLayout,
    layoutId,
    layouts,
    isLoading: isLoadingLayouts || isLoadingLayoutFields
  };
}
