
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ObjectTypeInfo } from "@/types/FieldMapping";

interface TargetObjectCreatorProps {
  sourceObject: ObjectTypeInfo;
  onObjectCreated: (targetObjectId: string) => void;
}

export function TargetObjectCreator({ sourceObject, onObjectCreated }: TargetObjectCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const createObject = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      setIsCreating(true);
      
      try {
        // Step 1: Create the object type
        const { data: objectData, error: objectError } = await supabase
          .from('object_types')
          .insert({
            name: `${sourceObject.name} (Imported)`,
            api_name: `${sourceObject.api_name}_imported`,
            description: `Imported from shared object: ${sourceObject.name}`,
            owner_id: user.id,
            is_active: true, // Using the default we just set
            show_in_navigation: true
          })
          .select()
          .single();
          
        if (objectError) throw objectError;
        
        // Step 2: Create the fields for the new object
        const fieldPromises = sourceObject.fields.map(field => {
          return supabase
            .from('object_fields')
            .insert({
              object_type_id: objectData.id,
              name: field.name,
              api_name: field.api_name,
              data_type: field.data_type,
              owner_id: user.id
            });
        });
        
        await Promise.all(fieldPromises);
        
        return objectData;
      } catch (error) {
        console.error("Error creating object:", error);
        if (error instanceof Error) {
          throw new Error(error.message);
        }
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
      toast.error("Failed to create object", {
        description: error.message || "Please try again"
      });
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
