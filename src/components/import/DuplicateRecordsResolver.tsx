
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ObjectField } from "@/hooks/useObjectTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { ObjectRecord } from "@/hooks/useObjectRecords";
import { SelectMultiple } from "@/components/ui/select-multiple";

interface DuplicateRecord {
  importRowIndex: number;
  existingRecord: ObjectRecord;
  matchingFields: string[];
  action: 'create' | 'update';
}

interface DuplicateRecordsResolverProps {
  duplicates: DuplicateRecord[];
  fields: ObjectField[];
  matchingFields: string[];
  columnMappings: any[];
  importData: { headers: string[]; rows: string[][] };
  onSetAction: (rowIndex: number, action: 'create' | 'update') => void;
  onUpdateMatchingFields: (fieldApiNames: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function DuplicateRecordsResolver({
  duplicates,
  fields,
  matchingFields,
  columnMappings,
  importData,
  onSetAction,
  onUpdateMatchingFields,
  onContinue,
  onBack
}: DuplicateRecordsResolverProps) {
  const [bulkAction, setBulkAction] = useState<'create' | 'update' | null>(null);

  // Get text and email fields that can be used for matching
  const matchableFields = fields.filter(field => 
    ["text", "email", "phone", "url", "textarea"].includes(field.data_type)
  );
  
  // Apply bulk action to all duplicates
  const handleApplyBulkAction = () => {
    if (bulkAction) {
      duplicates.forEach(duplicate => {
        onSetAction(duplicate.importRowIndex, bulkAction);
      });
    }
  };
  
  // Get field name display
  const getFieldName = (apiName: string) => {
    const field = fields.find(f => f.api_name === apiName);
    return field ? field.name : apiName;
  };
  
  // Get import row value for a field
  const getImportValue = (rowIndex: number, fieldApiName: string) => {
    const mapping = columnMappings.find(m => m.targetField?.api_name === fieldApiName);
    if (!mapping) return '-';
    const colIndex = mapping.sourceColumnIndex;
    return importData.rows[rowIndex][colIndex] || '';
  };
  
  // Get existing record value for a field
  const getExistingValue = (record: ObjectRecord, fieldApiName: string) => {
    return record.field_values?.[fieldApiName] || '';
  };
  
  // Check if values are different
  const valuesDiffer = (val1: string, val2: string) => {
    return val1.trim().toLowerCase() !== val2.trim().toLowerCase();
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription>
          {duplicates.length} duplicate {duplicates.length === 1 ? 'record was' : 'records were'} found based on the matching fields.
          Please decide whether to create new records or update existing ones.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matching Fields Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select the fields that should be used to identify duplicate records:
            </p>
            <SelectMultiple
              options={matchableFields.map(field => ({
                label: field.name,
                value: field.api_name
              }))}
              values={matchingFields}
              onChange={onUpdateMatchingFields}
            />
            <p className="text-xs text-muted-foreground italic">
              Records with matching values in all selected fields will be considered duplicates.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Duplicate Resolution</CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RadioGroup 
                value={bulkAction || ''}
                onValueChange={(val) => setBulkAction(val as 'create' | 'update')}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create" id="bulk-create" />
                  <Label htmlFor="bulk-create">Create All New</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="bulk-update" />
                  <Label htmlFor="bulk-update">Update All Existing</Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              size="sm" 
              onClick={handleApplyBulkAction}
              disabled={!bulkAction}
            >
              Apply to All
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead className="w-[150px] text-right">Row #</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((duplicate) => (
                  <TableRow key={duplicate.importRowIndex} className="border-b border-muted">
                    <TableCell className="p-2">
                      <RadioGroup 
                        value={duplicate.action}
                        onValueChange={(val) => onSetAction(duplicate.importRowIndex, val as 'create' | 'update')}
                        className="flex flex-col gap-1.5"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="create" id={`create-${duplicate.importRowIndex}`} />
                          <Label htmlFor={`create-${duplicate.importRowIndex}`} className="cursor-pointer">Create New</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="update" id={`update-${duplicate.importRowIndex}`} />
                          <Label htmlFor={`update-${duplicate.importRowIndex}`} className="cursor-pointer">Update Existing</Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="space-y-2">
                        {fields.map(field => {
                          const importValue = getImportValue(duplicate.importRowIndex, field.api_name);
                          const existingValue = getExistingValue(duplicate.existingRecord, field.api_name);
                          const isMatchingField = duplicate.matchingFields.includes(field.api_name);
                          const isDifferent = valuesDiffer(importValue, existingValue);
                          
                          // Only show fields that have values in either import or existing record
                          if (!importValue && !existingValue) return null;
                          
                          return (
                            <div 
                              key={field.api_name} 
                              className={`grid grid-cols-2 gap-2 text-sm p-1 rounded-sm ${isMatchingField ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
                            >
                              <div>
                                <p className="font-medium text-xs">{field.name}</p>
                                <div className="flex items-center gap-1">
                                  <span className={`${isDifferent ? 'text-muted-foreground line-through' : ''}`}>{existingValue || '-'}</span>
                                  {isMatchingField && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                      Match
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-xs">Import Value</p>
                                <span className={`${isDifferent ? 'text-green-600 dark:text-green-400' : ''}`}>{importValue || '-'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      Row {duplicate.importRowIndex + 1}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
