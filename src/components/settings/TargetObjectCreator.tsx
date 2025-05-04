
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ObjectTypeInfo } from "@/types/FieldMapping";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TargetObjectCreatorProps {
  sourceObject: ObjectTypeInfo;
  onObjectCreated: (targetObjectId: string) => void;
}

export function TargetObjectCreator({ sourceObject, onObjectCreated }: TargetObjectCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createObject = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      setIsCreating(true);
      setError(null);
      
      try {
        console.log("Creating object with source:", sourceObject);
        
        // Generate a unique API name to avoid conflicts
        const targetApiName = `${sourceObject.api_name}_imported`;
        
        // Step 1: Create the object type
        const { data: objectData, error: objectError } = await supabase
          .from('object_types')
          .insert({
            name: `${sourceObject.name} (Imported)`,
            api_name: targetApiName,
            description: `Imported from shared object: ${sourceObject.name}`,
            owner_id: user.id,
            is_active: true,
            show_in_navigation: true
          })
          .select()
          .single();
          
        if (objectError) {
          console.error("Error creating object type:", objectError);
          throw objectError;
        }
        
        if (!objectData || !objectData.id) {
          throw new Error("Failed to create object type - no ID returned");
        }
        
        console.log("Created object type:", objectData);
        
        // Step 2: Create the fields for the new object
        const fieldPromises = sourceObject.fields.map(field => {
          console.log("Creating field:", field);
          return supabase
            .from('object_fields')
            .insert({
              object_type_id: objectData.id,
              name: field.name,
              api_name: field.api_name,
              data_type: field.data_type,
              owner_id: user.id,
              is_required: field.data_type === 'text' && field.name.toLowerCase().includes('name')
            });
        });
        
        const fieldResults = await Promise.all(fieldPromises);
        
        // Check for field creation errors
        const fieldErrors = fieldResults.filter(result => result.error);
        if (fieldErrors.length > 0) {
          console.error("Errors creating fields:", fieldErrors);
          // We don't throw here as we want to return the object even if some fields failed
        }
        
        return objectData;
      } catch (error) {
        console.error("Error creating object:", error);
        if (error instanceof Error) {
          setError(error.message);
          throw new Error(error.message);
        }
        setError("Failed to create object type");
        throw new Error("Failed to create object type");
      }
    },
    onSuccess: (data) => {
      toast.success("Object created successfully", {
        description: `The object "${data.name}" has been created`
      });
      onObjectCreated(data.id);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Please try again";
      toast.error("Failed to create object", {
        description: errorMessage
      });
      setError(errorMessage);
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Target Object</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <p>
          The target object does not exist in your system. You need to create a new object
          to map the shared data to.
        </p>
        <div>
          <p className="font-medium">Source Object:</p>
          <p>{sourceObject.name} ({sourceObject.fields.length} fields)</p>
        </div>
        <Button 
          onClick={() => createObject.mutate()} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Matching Object
        </Button>
      </CardContent>
    </Card>
  );
}
