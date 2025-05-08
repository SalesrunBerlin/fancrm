import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectField } from "@/types/ObjectFieldTypes";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";

interface FilterFieldProps {
  filter: FilterCondition;
  fields: ObjectField[];
  onChange: (id: string, updates: Partial<FilterCondition>) => void;
}

export function FilterField({ filter, fields, onChange }: FilterFieldProps) {
  const selectedField = fields.find(field => field.api_name === filter.fieldApiName);
  const [picklistOptions, setPicklistOptions] = useState<{ value: string, label: string }[]>([]);

  // Fetch picklist values if needed
  useEffect(() => {
    if (selectedField?.data_type === "picklist") {
      fetchPicklistValues(selectedField.id);
    }
  }, [selectedField?.id, selectedField?.data_type]);

  const fetchPicklistValues = async (fieldId: string) => {
    try {
      const { data, error } = await supabase
        .from("field_picklist_values")
        .select("value, label")
        .eq("field_id", fieldId)
        .order("order_position", { ascending: true });
      
      if (error) throw error;
      
      setPicklistOptions(data.map(item => ({
        value: item.value,
        label: item.label || item.value
      })));
    } catch (err) {
      console.error("Error fetching picklist values:", err);
      setPicklistOptions([]);
    }
  };

  const getOperatorOptions = (dataType: string) => {
    switch (dataType) {
      case "text":
      case "email":
      case "url":
      case "rich_text":
      case "textarea":
        return [
          { value: "equals", label: "Equals" },
          { value: "contains", label: "Contains" },
          { value: "startsWith", label: "Starts with" },
          { value: "isNull", label: "Is empty" },
          { value: "isNotNull", label: "Is not empty" }
        ];
      case "number":
      case "currency":
        return [
          { value: "equals", label: "=" },
          { value: "notEqual", label: "≠" },
          { value: "greaterThan", label: ">" },
          { value: "lessThan", label: "<" },
          { value: "isNull", label: "Is empty" },
          { value: "isNotNull", label: "Is not empty" }
        ];
      case "date":
      case "datetime":
        return [
          { value: "equals", label: "On" },
          { value: "before", label: "Before" },
          { value: "after", label: "After" },
          { value: "isNull", label: "Is empty" },
          { value: "isNotNull", label: "Is not empty" }
        ];
      case "boolean":
        return [
          { value: "equals", label: "Is" }
        ];
      case "picklist":
      case "lookup":
        return [
          { value: "equals", label: "Is" },
          { value: "notEqual", label: "Is not" },
          { value: "isNull", label: "Is empty" },
          { value: "isNotNull", label: "Is not empty" }
        ];
      default:
        return [
          { value: "equals", label: "Equals" },
          { value: "isNull", label: "Is empty" },
          { value: "isNotNull", label: "Is not empty" }
        ];
    }
  };

  const renderValueInput = () => {
    if (!selectedField) return null;
    
    // For empty/not empty operators, don't render a value input
    if (["isNull", "isNotNull"].includes(filter.operator)) {
      return null;
    }
    
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
        return (
          <Select
            value={filter.value || ""}
            onValueChange={value => onChange(filter.id, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {picklistOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "lookup":
        // This is a simplified version that just allows text search
        // A more complete implementation would show a lookup selector
        return (
          <Input
            type="text"
            value={filter.value || ""}
            onChange={e => onChange(filter.id, { value: e.target.value })}
            className="w-full"
            placeholder="Search by name/id..."
          />
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

  // When field changes, update the operator to a suitable default for that field type
  const handleFieldChange = (fieldApiName: string) => {
    const field = fields.find(f => f.api_name === fieldApiName);
    if (field) {
      const defaultOperators = getOperatorOptions(field.data_type);
      onChange(filter.id, { 
        fieldApiName,
        operator: defaultOperators.length > 0 ? defaultOperators[0].value : "equals",
        value: field.data_type === "boolean" ? false : ""
      });
    } else {
      onChange(filter.id, { fieldApiName });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-start flex-1">
      <div className="min-w-[150px] flex-grow-0">
        <Select
          value={filter.fieldApiName}
          onValueChange={handleFieldChange}
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
      
      <div className="min-w-[120px] flex-grow-0">
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
