
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImpressumCandidate } from "@/hooks/useImpressumScrape";

interface ConfidenceBadgeProps {
  level: "low" | "medium" | "high";
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ level }) => {
  const colors = {
    low: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

export interface FieldCandidateProps {
  fieldName: string;
  candidates: ImpressumCandidate[];
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean) => void;
  confidenceLevel: "low" | "medium" | "high";
  isRequired?: boolean;
}

export const FieldCandidate: React.FC<FieldCandidateProps> = ({
  fieldName,
  candidates,
  value,
  onChange,
  onValidationChange,
  confidenceLevel,
  isRequired = false,
}) => {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isManualEntry, setIsManualEntry] = useState<boolean>(false);

  // Set initial validity based on whether the field is required and has a value
  useEffect(() => {
    const valid = !isRequired || (!!value && value.trim() !== "");
    setIsValid(valid);
    onValidationChange(valid);
  }, [isRequired, value, onValidationChange]);

  const handleValidationToggle = () => {
    const newIsValid = !isValid;
    setIsValid(newIsValid);
    onValidationChange(newIsValid);
    
    // If marking as invalid, automatically open the dropdown
    if (!newIsValid) {
      setIsManualEntry(false);
    }
  };

  const handleCandidateChange = (newValue: string) => {
    if (newValue === "__manual__") {
      setIsManualEntry(true);
      // Don't change the value yet, wait for manual input
    } else {
      setIsManualEntry(false);
      onChange(newValue);
      setIsValid(true);
      onValidationChange(true);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    const newIsValid = !isRequired || (newValue.trim() !== "");
    setIsValid(newIsValid);
    onValidationChange(newIsValid);
  };

  return (
    <div className={`space-y-2 p-3 rounded-md ${isValid ? "bg-green-50" : "bg-red-50"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={`field-${fieldName}`} className="text-sm font-medium">
            {fieldName}
          </Label>
          <ConfidenceBadge level={confidenceLevel} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={isValid ? "default" : "ghost"}
            size="sm"
            className={`h-6 w-6 p-0 rounded-full ${isValid ? "bg-green-500 hover:bg-green-600" : "text-green-600"}`}
            onClick={handleValidationToggle}
            type="button"
          >
            <Check className="h-3 w-3" />
            <span className="sr-only">Valid</span>
          </Button>
          <Button
            variant={!isValid ? "destructive" : "ghost"}
            size="sm"
            className={`h-6 w-6 p-0 rounded-full ${!isValid ? "bg-red-500 hover:bg-red-600" : "text-red-600"}`}
            onClick={handleValidationToggle}
            type="button"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Invalid</span>
          </Button>
        </div>
      </div>

      {isManualEntry ? (
        <Input
          id={`field-${fieldName}-manual`}
          value={value}
          onChange={handleManualInput}
          placeholder={`Enter ${fieldName} manually...`}
          className="w-full"
        />
      ) : (
        <Select
          onValueChange={handleCandidateChange}
          value={value}
          disabled={isValid && candidates[0]?.value === value}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${fieldName}...`} />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate, index) => (
              <SelectItem key={index} value={candidate.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{candidate.value || "Empty"}</span>
                  <span className="text-xs text-muted-foreground">
                    {candidate.method} ({Math.round(candidate.conf * 100)}%)
                  </span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="__manual__">
              <span className="italic">✏️ Enter manually...</span>
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {!isValid && !isManualEntry && (
        <p className="text-xs text-red-600 italic">
          Please select a valid option or enter manually
        </p>
      )}
    </div>
  );
};
