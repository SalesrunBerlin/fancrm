import { supabase } from "@/integrations/supabase/client";

// Definiere den Typ für die Standard-Objekte
interface DefaultObjectType {
  name: string;
  description: string;
  default_field_api_name: string | null;
}

// Definiere die Standard-Objekte
const defaultObjectTypes: DefaultObjectType[] = [
  {
    name: 'Contact',
    description: 'Manage your contacts',
    default_field_api_name: 'email'
  },
  {
    name: 'Account',
    description: 'Manage your accounts',
    default_field_api_name: 'name'
  },
  {
    name: 'Opportunity',
    description: 'Manage your opportunities',
    default_field_api_name: 'name'
  },
];

// Diese Funktion wird aufgerufen, um die Standard-Objekte zu erstellen
export const initializeDefaultObjectTypes = async (userId: string): Promise<void> => {
  try {
    const { data: existingObjects, error: checkError } = await supabase
      .from('object_types')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_system', true);

    if (checkError) {
      console.error("Error checking for existing objects:", checkError);
      return;
    }

    if (!existingObjects || existingObjects.length === 0) {
      // Korrigieren des Typs für die upsert Operation - jedes Objekt einzeln einfügen
      for (const objectType of defaultObjectTypes) {
        // Füge api_name hinzu, die zuvor gefehlt hat
        const { error } = await supabase
          .from('object_types')
          .insert({
            owner_id: userId,
            name: objectType.name,
            api_name: objectType.name.toLowerCase().replace(/ /g, '_'),
            description: objectType.description,
            default_field_api_name: objectType.default_field_api_name,
            is_system: true
          });

        if (error) {
          console.error(`Error creating object type ${objectType.name}:`, error);
        }
      }
      
      // Rest der Initialisierungslogik...
    }

    // Überprüfe, ob die Standardfelder für jedes Objekt vorhanden sind und erstelle sie, falls nicht
    for (const objectType of defaultObjectTypes) {
      const objectTypeName = objectType.name;
      const objectTypeApiName = objectTypeName.toLowerCase().replace(/ /g, '_');

      // Hole die Objekt-ID basierend auf dem Namen
      const { data: objectTypeData, error: objectTypeError } = await supabase
        .from('object_types')
        .select('id')
        .eq('owner_id', userId)
        .eq('api_name', objectTypeApiName)
        .single();

      if (objectTypeError) {
        console.error(`Error fetching object type ${objectTypeName}:`, objectTypeError);
        continue;
      }

      if (!objectTypeData) {
        console.warn(`Object type ${objectTypeName} not found for user ${userId}`);
        continue;
      }

      const objectTypeId = objectTypeData.id;

      // Definiere die Standardfelder für jedes Objekt
      const defaultFields = getDefaultFieldsForObjectType(objectTypeName);

      for (const field of defaultFields) {
        // Überprüfe, ob das Feld bereits existiert
        const { data: existingField, error: fieldCheckError } = await supabase
          .from('object_fields')
          .select('*')
          .eq('object_type_id', objectTypeId)
          .eq('api_name', field.api_name)
          .single();

        if (fieldCheckError) {
          console.error(`Error checking for existing field ${field.name} in ${objectTypeName}:`, fieldCheckError);
          continue;
        }

        if (!existingField) {
          // Erstelle das Feld, wenn es nicht existiert
          const { error: fieldCreateError } = await supabase
            .from('object_fields')
            .insert({
              object_type_id: objectTypeId,
              name: field.name,
              api_name: field.api_name,
              data_type: field.data_type,
              is_required: field.is_required || false,
              display_order: field.display_order,
              options: field.options ? JSON.stringify(field.options) : null,
            });

          if (fieldCreateError) {
            console.error(`Error creating field ${field.name} in ${objectTypeName}:`, fieldCreateError);
          } else {
            console.log(`Created field ${field.name} in ${objectTypeName}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error initializing default object types:", error);
  }
};

// Hilfsfunktion, um die Standardfelder für jeden Objekttyp zu definieren
const getDefaultFieldsForObjectType = (objectTypeName: string) => {
  switch (objectTypeName) {
    case 'Contact':
      return [
        { name: 'First Name', api_name: 'first_name', data_type: 'text', is_required: true, display_order: 1 },
        { name: 'Last Name', api_name: 'last_name', data_type: 'text', display_order: 2 },
        { name: 'Email', api_name: 'email', data_type: 'email', is_required: true, display_order: 3 },
        { name: 'Phone', api_name: 'phone', data_type: 'text', display_order: 4 },
      ];
    case 'Account':
      return [
        { name: 'Name', api_name: 'name', data_type: 'text', is_required: true, display_order: 1 },
        { name: 'Website', api_name: 'website', data_type: 'url', display_order: 2 },
        { name: 'Industry', api_name: 'industry', data_type: 'text', display_order: 3 },
        { name: 'Employees', api_name: 'employees', data_type: 'number', display_order: 4 },
      ];
    case 'Opportunity':
      return [
        { name: 'Name', api_name: 'name', data_type: 'text', is_required: true, display_order: 1 },
        { name: 'Amount', api_name: 'amount', data_type: 'currency', display_order: 2 },
        { name: 'Close Date', api_name: 'close_date', data_type: 'date', display_order: 3 },
        { name: 'Stage', api_name: 'stage', data_type: 'picklist', display_order: 4, options: { values: [{ label: 'Prospecting', value: 'prospecting' }, { label: 'Qualification', value: 'qualification' }, { label: 'Proposal', value: 'proposal' }, { label: 'Closing', value: 'closing' }] } },
      ];
    default:
      return [];
  }
};
