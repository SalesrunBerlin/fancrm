
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
import { Badge } from "@/components/ui/badge";

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

interface MethodBadgeProps {
  method: string;
  confidence: number;
}

const MethodBadge: React.FC<MethodBadgeProps> = ({ method, confidence }) => {
  // Choose color based on method type
  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'regex':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'tel-link':
      case 'mailto':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'jsonld':
      case 'microdata':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'heading':
      case 'bold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const color = getMethodColor(method);
  const confPercent = Math.round(confidence * 100);

  return (
    <Badge variant="outline" className={`text-xs px-2 py-1 rounded border ${color} ml-2 font-normal`}>
      {method} ({confPercent}%)
    </Badge>
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
  const [currentCandidate, setCurrentCandidate] = useState<ImpressumCandidate | null>(null);

  // Find the current candidate based on selected value
  useEffect(() => {
    const found = candidates.find(c => c.value === value);
    setCurrentCandidate(found || null);
  }, [value, candidates]);

  // Set initial validity based on whether the field is required and has a value
  useEffect(() => {
    const valid = !isRequired || (!!value && value.trim() !== "");
    setIsValid(valid);
    onValidationChange(valid);
  }, [isRequired, value, onValidationChange]);

  const handleValidationToggle = (newIsValid: boolean) => {
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
      
      // Find and set the current candidate
      const found = candidates.find(c => c.value === newValue);
      setCurrentCandidate(found || null);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    const newIsValid = !isRequired || (newValue.trim() !== "");
    setIsValid(newIsValid);
    onValidationChange(newIsValid);
    setCurrentCandidate(null); // Clear current candidate as we're typing manually
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
            onClick={() => handleValidationToggle(true)}
            type="button"
          >
            <Check className="h-3 w-3" />
            <span className="sr-only">Valid</span>
          </Button>
          <Button
            variant={!isValid ? "destructive" : "ghost"}
            size="sm"
            className={`h-6 w-6 p-0 rounded-full ${!isValid ? "bg-red-500 hover:bg-red-600" : "text-red-600"}`}
            onClick={() => handleValidationToggle(false)}
            type="button"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Invalid</span>
          </Button>
        </div>
      </div>

      {isManualEntry ? (
        <div className="space-y-2">
          <Input
            id={`field-${fieldName}-manual`}
            value={value}
            onChange={handleManualInput}
            placeholder={`Enter ${fieldName} manually...`}
            className="w-full"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center">
            <Select
              onValueChange={handleCandidateChange}
              value={value}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${fieldName}...`} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate, index) => (
                  <SelectItem key={index} value={candidate.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{candidate.value || "Empty"}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="__manual__">
                  <span className="italic">✏️ Enter manually...</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Display method and confidence as a badge if a candidate is selected */}
          {currentCandidate && (
            <div className="mt-1">
              <MethodBadge 
                method={currentCandidate.method} 
                confidence={currentCandidate.conf}
              />
            </div>
          )}
        </div>
      )}

      {!isValid && !isManualEntry && (
        <p className="text-xs text-red-600 italic">
          Please select a valid option or enter manually
        </p>
      )}
    </div>
  );
};
