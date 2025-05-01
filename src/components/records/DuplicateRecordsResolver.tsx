
import { useState } from "react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, WarningCircle, ArrowLeft, Loader2 } from "lucide-react";

interface DuplicateRecordsResolverProps {
  fields: ObjectField[];
  matchingFields: string[];
  columnMappings: { [columnName: string]: string | null };
  importData: any[];
  selectedField: string | null;
  onFieldSelect: (fieldApiName: string) => void;
  onImportStrategyChange: (strategy: 'update' | 'skip') => void;
  onRecheck: () => void;
}

export function DuplicateRecordsResolver({
  fields,
  matchingFields,
  columnMappings,
  importData,
  selectedField,
  onFieldSelect,
  onImportStrategyChange,
  onRecheck,
}: DuplicateRecordsResolverProps) {
  const [importStrategy, setImportStrategy] = useState<'update' | 'skip'>('update');
  const [isLoading, setIsLoading] = useState(false);

  // Get the column names that correspond to the matching fields
  const getMatchingColumnNames = () => {
    return Object.entries(columnMappings)
      .filter(([, apiName]) => apiName === selectedField)
      .map(([columnName]) => columnName);
  };

  const handleStrategyChange = (value: string) => {
    setImportStrategy(value as 'update' | 'skip');
    onImportStrategyChange(value as 'update' | 'skip');
  };

  const handleRecheck = () => {
    setIsLoading(true);
    onRecheck();
    // The parent component will handle the actual rechecking
    // This is just to update the UI state
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Potential Duplicate Records Detected</h3>
        </div>
        
        <p className="text-muted-foreground">
          We've detected potential duplicate records in your import data. 
          Please select a field to use for matching records and choose how to handle duplicates.
        </p>

        <div className="space-y-2">
          <Label htmlFor="matching-field">Match records using field:</Label>
          <Select 
            value={selectedField || ""} 
            onValueChange={onFieldSelect}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a field to match records" />
            </SelectTrigger>
            <SelectContent>
              {fields.map(field => (
                <SelectItem key={field.id} value={field.api_name}>{field.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {matchingFields.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Matching using column{matchingFields.length > 1 ? 's' : ''}: {matchingFields.join(', ')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>When a duplicate is found:</Label>
          <RadioGroup 
            value={importStrategy}
            onValueChange={handleStrategyChange}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="update" id="update" />
              <Label htmlFor="update" className="cursor-pointer">Update the existing record</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip" className="cursor-pointer">Skip importing the duplicate</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleRecheck}
            disabled={isLoading || !selectedField}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Re-check duplicates
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
