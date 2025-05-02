
import { useState, useEffect } from "react";
import { useActionFields } from "@/hooks/useActionFields";
import { useObjectFields } from "@/hooks/useObjectFields";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoCircle, Loader2, Plus, ArrowUp, ArrowDown, X, Info } from "lucide-react";
import { ActionFieldWithDetails } from "@/hooks/useActionFields";
import { evaluateFormula } from "@/utils/formulaEvaluator";

interface ActionFieldsManagerProps {
  actionId: string;
  objectTypeId: string;
}

export function ActionFieldsManager({
  actionId,
  objectTypeId,
}: ActionFieldsManagerProps) {
  const { fields, addField, updateField, removeField, updateFieldsOrder, isLoading } = useActionFields(actionId);
  const { fields: objectFields } = useObjectFields(objectTypeId);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [defaultValue, setDefaultValue] = useState<string>("");
  const [formulaType, setFormulaType] = useState<"static" | "dynamic">("static");
  const [formulaExpression, setFormulaExpression] = useState<string>("");
  const [formulaPreview, setFormulaPreview] = useState<string>("");

  // Reset when fields change
  useEffect(() => {
    setSelectedFieldId("");
    setDefaultValue("");
    setFormulaType("static");
    setFormulaExpression("");
    setFormulaPreview("");
  }, [fields]);

  // Update formula preview
  useEffect(() => {
    if (formulaType === "dynamic" && formulaExpression) {
      setFormulaPreview(evaluateFormula(formulaExpression));
    } else {
      setFormulaPreview("");
    }
  }, [formulaType, formulaExpression]);

  const handleAddField = async () => {
    if (!selectedFieldId) return;
    
    try {
      await addField.mutateAsync({
        action_id: actionId,
        field_id: selectedFieldId,
        default_value: formulaType === "static" ? defaultValue : null,
        formula_type: formulaType,
        formula_expression: formulaType === "dynamic" ? formulaExpression : null,
        display_order: fields?.length || 0,
      });
      setSelectedFieldId("");
      setDefaultValue("");
      setFormulaType("static");
      setFormulaExpression("");
    } catch (error) {
      console.error("Failed to add field:", error);
    }
  };

  const handleUpdatePreselection = async (field: ActionFieldWithDetails, isPreselected: boolean) => {
    try {
      await updateField.mutateAsync({
        id: field.id,
        is_preselected: isPreselected,
      });
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  const handleUpdateDefaultValue = async (field: ActionFieldWithDetails, value: string) => {
    try {
      await updateField.mutateAsync({
        id: field.id,
        default_value: value,
        formula_type: "static",
        formula_expression: null,
      });
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  const handleUpdateFormula = async (field: ActionFieldWithDetails, expression: string) => {
    try {
      await updateField.mutateAsync({
        id: field.id,
        default_value: null,
        formula_type: "dynamic",
        formula_expression: expression,
      });
    } catch (error) {
      console.error("Failed to update formula:", error);
    }
  };

  const handleMoveField = async (index: number, direction: "up" | "down") => {
    if (!fields) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[newIndex];
    newFields[newIndex] = temp;

    const updates = [
      {
        id: newFields[index].id,
        display_order: index,
      },
      {
        id: newFields[newIndex].id,
        display_order: newIndex,
      },
    ];

    try {
      await updateFieldsOrder.mutateAsync(updates);
    } catch (error) {
      console.error("Failed to reorder fields:", error);
    }
  };

  // Filter out object fields that are already selected
  const availableFields = objectFields?.filter(
    (field) => !fields?.some((f) => f.field_id === field.id)
  ) || [];

  // Get field name for formula helpers
  const getFieldNames = () => {
    return objectFields?.map(field => field.api_name) || [];
  };

  // Insert a formula helper into the formula expression
  const insertFormulaHelper = (helper: string) => {
    setFormulaExpression(prev => prev + helper);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Configure Fields</CardTitle>
        <CardDescription>
          Select fields to include in this action and configure their behavior
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Field selector */}
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-grow">
                <Label htmlFor="field-select">Add Field</Label>
                <Select
                  value={selectedFieldId}
                  onValueChange={setSelectedFieldId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleAddField}
                disabled={!selectedFieldId || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add
              </Button>
            </div>

            {selectedFieldId && (
              <div className="rounded-md border p-4">
                <Tabs defaultValue="static" value={formulaType} onValueChange={(value) => setFormulaType(value as "static" | "dynamic")}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="static">Static Value</TabsTrigger>
                    <TabsTrigger value="dynamic">Formula</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="static">
                    <div className="space-y-2">
                      <Label htmlFor="default-value">Default Value</Label>
                      <Input
                        id="default-value"
                        value={defaultValue}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        placeholder="Enter static default value"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="dynamic">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="formula-expression">Formula Expression</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Info className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">Formula Syntax Help</h4>
                                <p className="text-sm">Use these placeholders in your formulas:</p>
                                <ul className="text-sm space-y-1">
                                  <li><code>{`{RunningNumber}`}</code> - Sequential number</li>
                                  <li><code>{`{RunningNumber:000}`}</code> - Formatted number (001, 002)</li>
                                  <li><code>{`{Today}`}</code> - Current date</li>
                                  <li><code>{`{Today:yyyy-MM-dd}`}</code> - Formatted date</li>
                                  <li><code>{`{Now}`}</code> - Current date and time</li>
                                  <li><code>{`{FieldName}`}</code> - Reference to other field</li>
                                </ul>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Input
                          id="formula-expression"
                          value={formulaExpression}
                          onChange={(e) => setFormulaExpression(e.target.value)}
                          placeholder="E.g., Lead-{RunningNumber:000}"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => insertFormulaHelper("{RunningNumber:000}")}
                        >
                          + Running Number
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => insertFormulaHelper("{Today:yyyy-MM-dd}")}
                        >
                          + Today's Date
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => insertFormulaHelper("{Now}")}
                        >
                          + Current Time
                        </Button>
                      </div>
                      
                      {formulaExpression && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                          <div className="font-semibold mb-1">Preview:</div>
                          <div>{formulaPreview || formulaExpression}</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* Fields list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : fields?.length ? (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground pb-2 border-b">
                <div className="col-span-3">Field</div>
                <div className="col-span-2">Pre-selected</div>
                <div className="col-span-5">Default Value / Formula</div>
                <div className="col-span-2">Actions</div>
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-4 items-center py-3 border-b"
                >
                  <div className="col-span-3">
                    <div className="font-medium">{field.field_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {field.api_name}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Switch
                      checked={field.is_preselected}
                      onCheckedChange={(checked) =>
                        handleUpdatePreselection(field, checked)
                      }
                    />
                  </div>
                  <div className="col-span-5">
                    <Tabs defaultValue={(field.formula_type === "dynamic") ? "dynamic" : "static"}>
                      <TabsList className="mb-2 h-8">
                        <TabsTrigger className="text-xs h-6 px-2" value="static">Static</TabsTrigger>
                        <TabsTrigger className="text-xs h-6 px-2" value="dynamic">Formula</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="static">
                        <Input
                          value={field.default_value || ""}
                          onChange={(e) =>
                            handleUpdateDefaultValue(field, e.target.value)
                          }
                          placeholder="No default"
                          className="h-8 text-sm"
                        />
                      </TabsContent>
                      
                      <TabsContent value="dynamic">
                        <div className="flex gap-2">
                          <Input
                            value={field.formula_expression || ""}
                            onChange={(e) =>
                              handleUpdateFormula(field, e.target.value)
                            }
                            placeholder="E.g., Lead-{RunningNumber:000}"
                            className="h-8 text-sm"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Info className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-3">
                              <p className="text-xs mb-1">Preview:</p>
                              <p className="text-sm font-medium">
                                {field.formula_expression ? 
                                  evaluateFormula(field.formula_expression) : 
                                  <span className="text-muted-foreground">No formula</span>
                                }
                              </p>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => handleMoveField(index, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === fields.length - 1}
                        onClick={() => handleMoveField(index, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removeField.mutate(field.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No fields added yet. Select fields to include in this action.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
