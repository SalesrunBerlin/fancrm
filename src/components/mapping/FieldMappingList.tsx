
import React from "react";
import { ArrowRightIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FieldMappingListProps {
  sourceFields: {
    id: string;
    name: string;
    api_name: string;
    data_type: string;
  }[];
  targetFields?: {
    id: string;
    name: string;
    api_name: string;
    data_type: string;
  }[];
  mappings: {
    source_field_api_name: string;
    target_field_api_name: string;
  }[];
  onFieldMappingChange: (sourceFieldApiName: string, targetFieldApiName: string) => void;
}

export function FieldMappingList({
  sourceFields,
  targetFields = [],
  mappings,
  onFieldMappingChange
}: FieldMappingListProps) {
  return (
    <Tabs defaultValue="fields" className="mt-6">
      <TabsList className="grid w-full grid-cols-1">
        <TabsTrigger value="fields">Field Mappings</TabsTrigger>
      </TabsList>
      <TabsContent value="fields" className="mt-4 space-y-4">
        {sourceFields.map(sourceField => (
          <div key={sourceField.id} className="grid grid-cols-5 items-center gap-4">
            <div className="col-span-2">
              <div className="font-medium">{sourceField.name}</div>
              <div className="text-sm text-muted-foreground">{sourceField.api_name}</div>
            </div>
            <div className="flex justify-center">
              <ArrowRightIcon className="h-4 w-4" />
            </div>
            <div className="col-span-2">
              <Select
                value={mappings.find(m => m.source_field_api_name === sourceField.api_name)?.target_field_api_name || "do_not_map"}
                onValueChange={(value) => onFieldMappingChange(sourceField.api_name, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="do_not_map">Do not map</SelectItem>
                  {targetFields
                    ?.filter(tf => tf.data_type === sourceField.data_type)
                    .map(field => (
                      <SelectItem key={field.id} value={field.api_name}>
                        {field.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
