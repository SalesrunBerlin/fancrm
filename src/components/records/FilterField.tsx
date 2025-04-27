
import { ObjectField } from "@/hooks/useObjectTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface FilterCondition {
  id: string;
  fieldApiName: string;
  operator: string;
  value: any;
}

interface FilterFieldProps {
  filter: FilterCondition;
  fields: ObjectField[];
  onChange: (id: string, updates: Partial<FilterCondition>) => void;
}

export function FilterField({ filter, fields, onChange }: FilterFieldProps) {
  const selectedField = fields.find(field => field.api_name === filter.fieldApiName);

  const getOperatorOptions = (dataType: string) => {
    switch (dataType) {
      case "text":
      case "email":
      case "url":
        return [
          { value: "equals", label: "Equals" },
          { value: "contains", label: "Contains" },
          { value: "startsWith", label: "Starts with" }
        ];
      case "number":
      case "currency":
        return [
          { value: "equals", label: "=" },
          { value: "greaterThan", label: ">" },
          { value: "lessThan", label: "<" }
        ];
      case "date":
      case "datetime":
        return [
          { value: "equals", label: "On" },
          { value: "before", label: "Before" },
          { value: "after", label: "After" }
        ];
      case "boolean":
        return [
          { value: "equals", label: "Is" }
        ];
      case "picklist":
        return [
          { value: "equals", label: "Is" },
          { value: "notEqual", label: "Is not" }
        ];
      default:
        return [
          { value: "equals", label: "Equals" }
        ];
    }
  };

  const renderValueInput = () => {
    if (!selectedField) return null;
    
    switch (selectedField.data_type) {
      case "date":
        return (
          <Input
            type="date"
            value={filter.value || ""}
            onChange={e => onChange(filter.id, { value: e.target.value })}
            className="w-full"
          />
        );
      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={filter.value || ""}
            onChange={e => onChange(filter.id, { value: e.target.value })}
            className="w-full"
          />
        );
      case "number":
      case "currency":
        return (
          <Input
            type="number"
            value={filter.value || ""}
            onChange={e => onChange(filter.id, { value: e.target.value ? Number(e.target.value) : "" })}
            className="w-full"
            step={selectedField.data_type === "currency" ? "0.01" : "1"}
          />
        );
      case "boolean":
        return (
          <Select
            value={String(!!filter.value)}
            onValueChange={value => onChange(filter.id, { value: value === "true" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case "picklist":
        // This is a simplified version - ideally we would get options from field definition
        return (
          <Select
            value={filter.value || ""}
            onValueChange={value => onChange(filter.id, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type="text"
            value={filter.value || ""}
            onChange={e => onChange(filter.id, { value: e.target.value })}
            className="w-full"
          />
        );
    }
  };

  const operatorOptions = selectedField ? getOperatorOptions(selectedField.data_type) : [];

  return (
    <div className="flex flex-wrap gap-2 items-start flex-1">
      <div className="min-w-[150px]">
        <Select
          value={filter.fieldApiName}
          onValueChange={value => onChange(filter.id, { fieldApiName: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {fields.map(field => (
              <SelectItem key={field.api_name} value={field.api_name}>
                {field.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="min-w-[120px]">
        <Select
          value={filter.operator}
          onValueChange={value => onChange(filter.id, { operator: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent>
            {operatorOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1">
        {renderValueInput()}
      </div>
    </div>
  );
}
