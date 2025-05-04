
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ObjectMappingSelector } from "./ObjectMappingSelector";
import { FieldMappingList } from "./FieldMappingList";
import { ObjectTypeInfo } from "@/types/FieldMapping";
import { TargetObjectCreator } from "@/components/settings/TargetObjectCreator";

interface MappingFormProps {
  sourceObjectInfo: ObjectTypeInfo;
  targetObjectExists: boolean | null;
  selectedTargetObjectId: string | null;
  objectTypes: { id: string; name: string }[];
  targetFields: any[];
  mappings: {
    source_field_api_name: string;
    target_field_api_name: string;
  }[];
  isSubmitting: boolean;
  onTargetObjectChange: (objectId: string) => void;
  onFieldMappingChange: (sourceFieldApiName: string, targetFieldApiName: string) => void;
  onObjectCreated: (objectId: string) => void;
  onSubmit: () => void;
  onGoBack: () => void;
}

export function MappingForm({
  sourceObjectInfo,
  targetObjectExists,
  selectedTargetObjectId,
  objectTypes,
  targetFields,
  mappings,
  isSubmitting,
  onTargetObjectChange,
  onFieldMappingChange,
  onObjectCreated,
  onSubmit,
  onGoBack
}: MappingFormProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Object Mapping</CardTitle>
        <CardDescription>
          Select the target object in your system that should receive data from {sourceObjectInfo.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {targetObjectExists === false ? (
          <TargetObjectCreator 
            sourceObject={sourceObjectInfo}
            onObjectCreated={onObjectCreated}
          />
        ) : (
          <div className="space-y-4">
            <ObjectMappingSelector
              sourceObject={sourceObjectInfo}
              targetObjectId={selectedTargetObjectId}
              objectTypes={objectTypes}
              onObjectChange={onTargetObjectChange}
            />

            {selectedTargetObjectId && (
              <FieldMappingList
                sourceFields={sourceObjectInfo.fields}
                targetFields={targetFields}
                mappings={mappings}
                onFieldMappingChange={onFieldMappingChange}
              />
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!selectedTargetObjectId || targetObjectExists === false || isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Mappings
        </Button>
      </CardFooter>
    </Card>
  );
}
