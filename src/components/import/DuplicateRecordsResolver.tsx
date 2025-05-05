import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DuplicateRecordsResolverProps {
  duplicates: any[];
  onResolved: (resolutions: { [key: string]: string }) => void;
  onCancel: () => void;
}

export function DuplicateRecordsResolver({ duplicates, onResolved, onCancel }: DuplicateRecordsResolverProps) {
  const [resolutions, setResolutions] = useState<{ [key: string]: string }>({});

  const handleResolutionChange = (recordType: string, index: number, value: string) => {
    setResolutions(prev => ({ ...prev, [`${recordType}-${index}`]: value }));
  };

  const handleResolve = () => {
    onResolved(resolutions);
  };

  const renderDuplicateRows = (recordType: string, recordDuplicates: any[]) => {
    
    return (
      <div className="space-y-4 mt-4">
        {recordDuplicates.map((duplicate: any, index: number) => (
          <div key={index} className="border rounded-md p-4 bg-background">
            <h4 className="font-medium mb-2">Duplicate Record #{index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">New Record</h5>
                <dl className="space-y-1">
                  {Object.entries(duplicate.newRecord).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2">
                      <dt className="text-sm font-medium">{key}:</dt>
                      <dd className="text-sm">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Existing Record</h5>
                <dl className="space-y-1">
                  {Object.entries(duplicate.existingRecord).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2">
                      <dt className="text-sm font-medium">{key}:</dt>
                      <dd className="text-sm">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium">Resolution Strategy:</span>
              <RadioGroup
                value={resolutions[`${recordType}-${index}`] || "skip"}
                onValueChange={(value) => handleResolutionChange(recordType, index, value)}
              >
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="skip" id={`skip-${recordType}-${index}`} />
                    <Label htmlFor={`skip-${recordType}-${index}`}>Skip (Don't import)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="create" id={`create-${recordType}-${index}`} />
                    <Label htmlFor={`create-${recordType}-${index}`}>Create New Record</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update" id={`update-${recordType}-${index}`} />
                    <Label htmlFor={`update-${recordType}-${index}`}>Update Existing Record</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Resolve Duplicate Records</h3>
      <p className="text-sm text-muted-foreground">
        For each set of potential duplicate records, choose a resolution strategy.
      </p>

      {Object.entries(duplicates).map(([recordType, recordDuplicates]) => (
        <div key={recordType} className="space-y-2">
          <h4 className="text-md font-semibold">{recordType}</h4>
          {renderDuplicateRows(recordType, recordDuplicates as any[])}
        </div>
      ))}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md bg-muted hover:bg-muted-foreground hover:text-muted text-foreground"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary"
          onClick={handleResolve}
        >
          Resolve Duplicates
        </button>
      </div>
    </div>
  );
}
