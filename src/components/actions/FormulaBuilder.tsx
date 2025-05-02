
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { evaluateFormula } from "@/utils/formulaEvaluator";

interface FormulaBuilderProps {
  value: string;
  onChange: (value: string) => void;
  fieldNames?: string[];
  className?: string;
}

export function FormulaBuilder({
  value,
  onChange,
  fieldNames = [],
  className,
}: FormulaBuilderProps) {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (value) {
      setPreview(evaluateFormula(value));
    } else {
      setPreview("");
    }
  }, [value]);

  const insertTemplate = (template: string) => {
    onChange(value + template);
  };

  return (
    <div className={`space-y-3 ${className}`}>
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
                  <li><code>{`{Today}`}</code> - Current date</li>
                  <li><code>{`{Today:yyyy-MM-dd}`}</code> - Formatted date</li>
                  <li><code>{`{Now}`}</code> - Current date and time</li>
                  <li><code>{`{FieldName}`}</code> - Reference to other field</li>
                  <li><code>{`{LookupField.FieldName}`}</code> - Reference to lookup field</li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Input
          id="formula-expression"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="E.g., {Today:yyyy-MM-dd}"
          className="mt-1"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => insertTemplate("{Today:yyyy-MM-dd}")}
        >
          + Today's Date
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => insertTemplate("{Now}")}
        >
          + Current Time
        </Button>
        
        {fieldNames.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                + Field Reference
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-2">
                <h4 className="font-medium">Select Field</h4>
                <div className="grid gap-1 max-h-40 overflow-y-auto">
                  {fieldNames.map((fieldName) => (
                    <Button
                      key={fieldName}
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => insertTemplate(`{${fieldName}}`)}
                    >
                      {fieldName}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {value && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <div className="font-semibold mb-1">Preview:</div>
          <div>{preview || value}</div>
        </div>
      )}
    </div>
  );
}
