
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PublishedApplication } from "@/types/publishing";
import { useState } from "react";

export interface ApplicationImport {
  id: string;
  published_application_id: string;
  imported_by: string;
  import_status: "pending" | "completed" | "failed";
  imported_objects_count: number;
  imported_actions_count: number;
  created_at: string;
  updated_at: string;
  published_application?: PublishedApplication;
}

export interface ImportApplicationInput {
  publishedApplicationId: string;
  selectedObjectIds: string[];
  selectedActionIds: string[];
  applicationName?: string;
}

export function useApplicationImport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [importProgress, setImportProgress] = useState<{
    currentStep: string;
    totalSteps: number;
    currentStepNumber: number;
  }>({
    currentStep: "",
    totalSteps: 0,
    currentStepNumber: 0
  });

  // Get import history for the current user
  const {
    data: importHistory,
    isLoading: isLoadingImportHistory,
    error: importHistoryError,
    refetch: refetchImportHistory
  } = useQuery({
    queryKey: ["application-imports"],
    queryFn: async (): Promise<ApplicationImport[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("application_imports")
        .select("*, published_application:published_application_id(*)")
        .eq("imported_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching import history:", error);
        throw error;
      }

      // Transform data to ensure import_status is of the correct type
      return data?.map(item => ({
        ...item,
        import_status: item.import_status as "pending" | "completed" | "failed"
      })) || [];
    },
    enabled: !!user
  });

  // Import an application
  const importApplication = useMutation({
    mutationFn: async (input: ImportApplicationInput): Promise<ApplicationImport> => {
      if (!user) {
        throw new Error("User must be logged in to import an application");
      }

      try {
        setImportProgress({
          currentStep: "Creating import record",
          totalSteps: input.selectedObjectIds.length + input.selectedActionIds.length + 3,
          currentStepNumber: 1
        });

        // 1. Create an import record
        const { data: importRecord, error: importError } = await supabase
          .from("application_imports")
          .insert({
            published_application_id: input.publishedApplicationId,
            imported_by: user.id,
            import_status: "pending"
          })
          .select()
          .single();

        if (importError) {
          console.error("Error creating import record:", importError);
          throw importError;
        }

        // 2. Create a new application for the imported components
        setImportProgress({
          currentStep: "Creating application",
          totalSteps: input.selectedObjectIds.length + input.selectedActionIds.length + 3,
          currentStepNumber: 2
        });
        
        // Get published application details to use for the new application
        const { data: publishedApp, error: publishedAppError } = await supabase
          .from("published_applications")
          .select("*")
          .eq("id", input.publishedApplicationId)
          .single();
          
        if (publishedAppError) {
          console.error("Error fetching published application details:", publishedAppError);
          throw publishedAppError;
        }
        
        // Create a new application
        const appName = input.applicationName || `${publishedApp.name} (Imported)`;
        const { data: newApp, error: newAppError } = await supabase
          .from("applications")
          .insert({
            name: appName,
            description: `Imported from ${publishedApp.name}`,
            owner_id: user.id
          })
          .select()
          .single();
          
        if (newAppError) {
          console.error("Error creating application:", newAppError);
          throw newAppError;
        }

        let importedObjectsCount = 0;
        let importedActionsCount = 0;

        // 3. Import objects using the clone_object_structure function
        for (let i = 0; i < input.selectedObjectIds.length; i++) {
          const objectId = input.selectedObjectIds[i];
          setImportProgress({
            currentStep: `Importing object ${i + 1} of ${input.selectedObjectIds.length}`,
            totalSteps: input.selectedObjectIds.length + input.selectedActionIds.length + 3,
            currentStepNumber: 3 + i
          });
          
          try {
            // Call RPC function to clone the object type
            const { data: newObjectId, error: cloneError } = await supabase
              .rpc('clone_object_structure', {
                source_object_id: objectId,
                new_owner_id: user.id
              });
              
            if (cloneError) {
              console.error(`Error cloning object ${objectId}:`, cloneError);
              continue;
            }
            
            // Add the new object to the application
            if (newObjectId) {
              const { error: assignError } = await supabase
                .from("object_application_assignments")
                .insert({
                  application_id: newApp.id,
                  object_type_id: newObjectId,
                  owner_id: user.id
                });
                
              if (assignError) {
                console.error("Error assigning object to application:", assignError);
                continue;
              }
              
              importedObjectsCount++;
            }
          } catch (error) {
            console.error("Error importing object:", error);
          }
        }

        // 4. Import actions
        // Since we don't have a direct clone_action RPC function, we'll need to create them manually
        for (let i = 0; i < input.selectedActionIds.length; i++) {
          const actionId = input.selectedActionIds[i];
          setImportProgress({
            currentStep: `Importing action ${i + 1} of ${input.selectedActionIds.length}`,
            totalSteps: input.selectedObjectIds.length + input.selectedActionIds.length + 3,
            currentStepNumber: 3 + input.selectedObjectIds.length + i
          });
          
          try {
            // Get the original action details
            const { data: originalAction, error: actionError } = await supabase
              .from("actions")
              .select("*")
              .eq("id", actionId)
              .single();
              
            if (actionError) {
              console.error(`Error fetching action ${actionId}:`, actionError);
              continue;
            }
            
            // Create a new action
            const { data: newAction, error: newActionError } = await supabase
              .from("actions")
              .insert({
                name: originalAction.name,
                description: originalAction.description,
                action_type: originalAction.action_type,
                target_object_id: originalAction.target_object_id, // Note: this might need adjustment based on object cloning
                source_field_id: null, // We'll need to update this after import
                lookup_field_id: null, // We'll need to update this after import
                color: originalAction.color,
                owner_id: user.id,
                is_public: originalAction.is_public
              })
              .select()
              .single();
              
            if (newActionError) {
              console.error("Error creating new action:", newActionError);
              continue;
            }
            
            // Get action field settings
            const { data: fieldSettings, error: fieldSettingsError } = await supabase
              .from("action_field_settings")
              .select("*")
              .eq("action_id", actionId);
              
            if (fieldSettingsError) {
              console.error("Error fetching action field settings:", fieldSettingsError);
            } else if (fieldSettings && fieldSettings.length > 0) {
              // Create new field settings
              const newFieldSettings = fieldSettings.map(setting => ({
                action_id: newAction.id,
                field_id: setting.field_id, // This might need adjustment based on cloned objects
                is_enabled: setting.is_enabled,
                is_preselected: setting.is_preselected,
                formula_type: setting.formula_type,
                formula_expression: setting.formula_expression,
                default_value: setting.default_value,
                display_order: setting.display_order
              }));
              
              const { error: newFieldSettingsError } = await supabase
                .from("action_field_settings")
                .insert(newFieldSettings);
                
              if (newFieldSettingsError) {
                console.error("Error creating action field settings:", newFieldSettingsError);
              }
            }
            
            importedActionsCount++;
          } catch (error) {
            console.error("Error importing action:", error);
          }
        }

        // 5. Update the import record with the results
        setImportProgress({
          currentStep: "Finalizing import",
          totalSteps: input.selectedObjectIds.length + input.selectedActionIds.length + 3,
          currentStepNumber: input.selectedObjectIds.length + input.selectedActionIds.length + 3
        });
        
        const { data: updatedRecord, error: updateError } = await supabase
          .from("application_imports")
          .update({
            import_status: "completed",
            imported_objects_count: importedObjectsCount,
            imported_actions_count: importedActionsCount
          })
          .eq("id", importRecord.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating import record:", updateError);
          throw updateError;
        }

        // Ensure the returned record has the correct type for import_status
        return {
          ...updatedRecord,
          import_status: updatedRecord.import_status as "pending" | "completed" | "failed"
        };
      } catch (error) {
        // Update the import record to failed status if there was an error
        if (importRecord && importRecord.id) {
          await supabase
            .from("application_imports")
            .update({
              import_status: "failed"
            })
            .eq("id", importRecord.id);
        }
        
        if (error instanceof Error) {
          console.error("Import failed:", error);
          toast.error("Import failed", { description: error.message });
        }
        throw error;
      } finally {
        setImportProgress({
          currentStep: "",
          totalSteps: 0,
          currentStepNumber: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-imports"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] }); 
      toast.success("Application imported successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to import application", {
        description: error.message || "An error occurred."
      });
    }
  });

  return {
    importHistory,
    isLoadingImportHistory,
    importHistoryError,
    importApplication,
    refetchImportHistory,
    importProgress
  };
}
