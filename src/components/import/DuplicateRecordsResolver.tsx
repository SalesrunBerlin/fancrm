
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { DuplicateRecord } from "@/types";
import { ColumnMapping } from "@/hooks/useImportRecords";

interface DuplicateRecordsResolverProps {
  duplicates: DuplicateRecord[];
  fields: ObjectField[];
  matchingFields: string[];
  columnMappings: ColumnMapping[];
  importData: { headers: string[]; rows: string[][] };
  onSetAction: (rowIndex: number, action: "skip" | "update" | "create") => void;
  onUpdateMatchingFields: (fieldApiNames: string[]) => void;
  onUpdateDuplicateCheckIntensity: (intensity: "lenient" | "moderate" | "strict") => void;
  duplicateCheckIntensity: "lenient" | "moderate" | "strict";
  onContinue: () => void;
  onBack: () => void;
  onRecheck: () => void;
}

export function DuplicateRecordsResolver({
  duplicates,
  fields,
  matchingFields,
  columnMappings,
  importData,
  onSetAction,
  onUpdateMatchingFields,
  onUpdateDuplicateCheckIntensity,
  duplicateCheckIntensity,
  onContinue,
  onBack,
  onRecheck,
}: DuplicateRecordsResolverProps) {
  const [activeTab, setActiveTab] = useState<"review" | "settings">("review");
  const [activeMatchFields, setActiveMatchFields] = useState<string[]>(matchingFields);
  const [activeIntensity, setActiveIntensity] = useState<"lenient" | "moderate" | "strict">(
    duplicateCheckIntensity
  );

  // Calculate summary statistics
  const totalDuplicates = duplicates.length;
  const skipCount = duplicates.filter(d => d.action === "skip").length;
  const updateCount = duplicates.filter(d => d.action === "update").length;
  const createCount = duplicates.filter(d => d.action === "create").length;

  const actionLabels = {
    skip: "Skip (Don't Import)",
    update: "Update Existing Record",
    create: "Create New Record Anyway",
  };

  const intensityLabels = {
    lenient: "Low - Only exact matches",
    moderate: "Medium - Close matches",
    strict: "High - Loose matches",
  };

  const handleFieldToggle = (fieldApiName: string) => {
    setActiveMatchFields(prev => 
      prev.includes(fieldApiName)
        ? prev.filter(f => f !== fieldApiName)
        : [...prev, fieldApiName]
    );
  };

  const handleApplySettings = () => {
    // Apply the new settings
    onUpdateMatchingFields(activeMatchFields);
    onUpdateDuplicateCheckIntensity(activeIntensity);
    
    // Go back to review tab
    setActiveTab("review");
    
    // Trigger recheck
    onRecheck();
  };

  // Get field name from API name
  const getFieldName = (apiName: string): string => {
    const field = fields.find(f => f.api_name === apiName);
    return field ? field.name : apiName;
  };

  // Get score label
  const getScoreLabel = (score: number): string => {
    if (score >= 0.9) return "High";
    if (score >= 0.7) return "Medium";
    return "Low";
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 0.9) return "bg-red-500";
    if (score >= 0.7) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Potential Duplicate Records</h3>
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "review" | "settings")}>
            <TabsList>
              <TabsTrigger value="review">Review Duplicates</TabsTrigger>
              <TabsTrigger value="settings">Matching Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <TabsContent value="review" className="space-y-4 mt-0">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            We found {totalDuplicates} potential duplicate{totalDuplicates !== 1 ? 's' : ''}. 
            Please review and choose what to do with each one.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="font-medium">Skip:</span> {skipCount}
            </div>
            <div>
              <span className="font-medium">Update:</span> {updateCount}
            </div>
            <div>
              <span className="font-medium">Create:</span> {createCount}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-6">
                {duplicates.map((duplicate, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex-1">
                        <h4 className="font-medium">Match #{index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            Confidence: {getScoreLabel(duplicate.matchScore)}
                          </div>
                          <Progress 
                            value={duplicate.matchScore * 100} 
                            className={`w-24 h-2 ${getScoreColor(duplicate.matchScore)}`} 
                          />
                        </div>
                      </div>
                      <RadioGroup 
                        value={duplicate.action} 
                        onValueChange={(value) => onSetAction(duplicate.importRowIndex, value as any)}
                        className="flex gap-4"
                      >
                        {Object.entries(actionLabels).map(([value, label]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`${index}-${value}`} />
                            <Label htmlFor={`${index}-${value}`} className="text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Import Record</div>
                        <Table>
                          <TableBody>
                            {duplicate.record && Object.entries(duplicate.record).map(([field, value], idx) => {
                              // Find the field name from the api name
                              const fieldObj = fields.find(f => f.api_name === field);
                              const fieldName = fieldObj ? fieldObj.name : field;
                              
                              return (
                                <TableRow key={idx}>
                                  <TableCell className="py-1 font-medium text-sm w-1/2">
                                    {fieldName}
                                  </TableCell>
                                  <TableCell className="py-1 text-sm">
                                    {value || <span className="text-muted-foreground italic">Empty</span>}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Existing Record</div>
                        <Table>
                          <TableBody>
                            {duplicate.existingRecord && Object.entries(duplicate.existingRecord)
                              .filter(([key]) => key !== 'id') // Filter out id field
                              .map(([field, value], idx) => {
                                // Find field name
                                const fieldName = getFieldName(field);
                                
                                return (
                                  <TableRow key={idx}>
                                    <TableCell className="py-1 font-medium text-sm w-1/2">
                                      {fieldName}
                                    </TableCell>
                                    <TableCell className="py-1 text-sm">
                                      {value ? String(value) : <span className="text-muted-foreground italic">Empty</span>}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4 mt-0">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Fields to Match On</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Select which fields should be used to detect duplicate records
              </p>
              <div className="border rounded-md p-4 space-y-2">
                {fields
                  .filter(field => field.data_type !== 'lookup')
                  .map(field => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`field-${field.id}`}
                        checked={activeMatchFields.includes(field.api_name)}
                        onCheckedChange={() => handleFieldToggle(field.api_name)}
                      />
                      <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Match Sensitivity</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Set how strict the matching should be
              </p>
              <Select 
                value={activeIntensity} 
                onValueChange={(val: "lenient" | "moderate" | "strict") => setActiveIntensity(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select match sensitivity" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(intensityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key as string}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Sensitivity Explanation</h3>
                <ul className="text-sm space-y-2 list-disc pl-5">
                  <li><span className="font-medium">Low:</span> Only exact matches on all selected fields</li>
                  <li><span className="font-medium">Medium:</span> Matches allowing some variation</li>
                  <li><span className="font-medium">High:</span> Finds more potential matches with less certainty</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleApplySettings}
            disabled={activeMatchFields.length === 0}
          >
            Apply Settings & Recheck
          </Button>
        </div>
      </TabsContent>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Mapping
        </Button>
        <Button onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
