import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useInitializeObjects() {
  const { user } = useAuth();

  useEffect(() => {
    const initialize = async () => {
      if (!user) return;

      try {
        // Check if the user already has the default object types
        const { data: existingObjectTypes, error: objectTypesError } = await supabase
          .from('object_types')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (objectTypesError) {
          console.error("Error checking existing object types:", objectTypesError);
          return;
        }

        if (existingObjectTypes && existingObjectTypes.length > 0) {
          console.log("User already has default object types. Skipping initialization.");
          return;
        }

        // Create default object types
        const { data: newObjectTypes, error: newObjectTypesError } = await supabase
          .from('object_types')
          .insert([
            { owner_id: user.id, name: 'Case', description: 'A customer support case', default_field_api_name: 'case_number' },
            { owner_id: user.id, name: 'Contact', description: 'A contact in the system', default_field_api_name: 'email' },
            { owner_id: user.id, name: 'Account', description: 'An account in the system', default_field_api_name: 'name' },
          ])
          .select('id, name');

        if (newObjectTypesError) {
          console.error("Error creating default object types:", newObjectTypesError);
          return;
        }

        if (!newObjectTypes || newObjectTypes.length === 0) {
          console.warn("No object types were created.");
          return;
        }

        // Create default fields for each object type
        for (const objectType of newObjectTypes) {
          let directValue: string;
          switch (objectType.name) {
            case 'Case':
              directValue = "auto_number" as string;
              await supabase.from('object_fields').insert([
                { object_type_id: objectType.id, name: 'Case Number', api_name: 'case_number', data_type: directValue, is_required: true, display_order: 1 },
                { object_type_id: objectType.id, name: 'Subject', api_name: 'subject', data_type: 'text', is_required: true, display_order: 2 },
                { object_type_id: objectType.id, name: 'Description', api_name: 'description', data_type: 'textarea', display_order: 3 },
                { object_type_id: objectType.id, name: 'Status', api_name: 'status', data_type: 'picklist', display_order: 4, options: { values: [{ label: 'Open', value: 'open' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Closed', value: 'closed' }] } },
                { object_type_id: objectType.id, name: 'Priority', api_name: 'priority', data_type: 'picklist', display_order: 5, options: { values: [{ label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' }] } },
              ]);
              // Create auto-number configuration for Case Number field
              const { data: caseNumberField } = await supabase
                .from('object_fields')
                .select('id')
                .eq('object_type_id', objectType.id)
                .eq('api_name', 'case_number')
                .single();

              if (caseNumberField) {
                await supabase
                  .from('auto_number_configurations')
                  .insert({
                    field_id: caseNumberField.id,
                    prefix: 'CASE-',
                    format_pattern: '00000',
                  });
              }
              break;
            case 'Contact':
              await supabase.from('object_fields').insert([
                { object_type_id: objectType.id, name: 'First Name', api_name: 'first_name', data_type: 'text', is_required: true, display_order: 1 },
                { object_type_id: objectType.id, name: 'Last Name', api_name: 'last_name', data_type: 'text', is_required: true, display_order: 2 },
                { object_type_id: objectType.id, name: 'Email', api_name: 'email', data_type: 'email', is_required: true, display_order: 3 },
                { object_type_id: objectType.id, name: 'Phone', api_name: 'phone', data_type: 'text', display_order: 4 },
              ]);
              break;
            case 'Account':
              await supabase.from('object_fields').insert([
                { object_type_id: objectType.id, name: 'Name', api_name: 'name', data_type: 'text', is_required: true, display_order: 1 },
                { object_type_id: objectType.id, name: 'Website', api_name: 'website', data_type: 'url', display_order: 2 },
                { object_type_id: objectType.id, name: 'Industry', api_name: 'industry', data_type: 'text', display_order: 3 },
              ]);
              break;
            default:
              console.warn(`Unknown object type: ${objectType.name}`);
          }
        }

        console.log("Default object types and fields initialized successfully.");

      } catch (error) {
        console.error("Error initializing default objects:", error);
      }
    };

    initialize();
  }, [user]);
}
