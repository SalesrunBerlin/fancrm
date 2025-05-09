
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { LayoutField } from "@/hooks/useLayoutFields";
import { Loader2 } from "lucide-react";

interface LayoutFieldEditorProps {
  fields: ObjectField[];
  layoutFields: LayoutField[];
  isLoading?: boolean;
  onMoveUp: (fieldId: string, currentOrder: number) => void;
  onMoveDown: (fieldId: string, currentOrder: number) => void;
  onToggleVisibility: (fieldId: string, isCurrentlyVisible: boolean) => void;
}

export function LayoutFieldEditor({
  fields,
  layoutFields,
  isLoading,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
}: LayoutFieldEditorProps) {
  
  // Map layout fields to a more convenient format
  const fieldMap = new Map<string, { order: number; visible: boolean; layoutFieldId: string }>();
  layoutFields.forEach((layoutField) => {
    fieldMap.set(layoutField.field_id, {
      order: layoutField.display_order,
      visible: layoutField.is_visible,
      layoutFieldId: layoutField.id
    });
  });

  const getFieldConfig = (fieldId: string) => {
    return fieldMap.get(fieldId) || { order: 999, visible: true, layoutFieldId: "" };
  };

  // Sort fields by layout order
  const sortedFields = [...fields].sort((a, b) => {
    const aConfig = getFieldConfig(a.id);
    const bConfig = getFieldConfig(b.id);
    return aConfig.order - bConfig.order;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedFields.map((field, index) => {
        const fieldConfig = getFieldConfig(field.id);
        
        return (
          <Card key={field.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium flex items-center">
                    {field.name}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    {field.is_system && <Badge variant="outline" className="ml-2">System</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {field.api_name}
                  </div>
                  <Badge variant="outline" className="mt-1">{field.data_type}</Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={index === 0}
                    onClick={() => onMoveUp(fieldConfig.layoutFieldId, fieldConfig.order)}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Move field up</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={index === sortedFields.length - 1}
                    onClick={() => onMoveDown(fieldConfig.layoutFieldId, fieldConfig.order)}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span className="sr-only">Move field down</span>
                  </Button>
                  
                  <Button
                    variant={fieldConfig.visible ? "outline" : "ghost"}
                    size="icon"
                    onClick={() => onToggleVisibility(fieldConfig.layoutFieldId, fieldConfig.visible)}
                    title={fieldConfig.visible ? "Hide field" : "Show field"}
                  >
                    {fieldConfig.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {fieldConfig.visible ? "Hide field" : "Show field"}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
