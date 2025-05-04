
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LookupField } from "./LookupField";

interface RecordFieldProps {
  field: {
    id: string;
    name: string;
    api_name: string;
    data_type: string;
    is_required: boolean;
    options?: any;
  };
  form: any;
  disabled?: boolean;
  onCustomChange?: (value: any) => void; // Added custom change handler
  hideLabel?: boolean;
  labelClassName?: string;
}

export function RecordField({
  field,
  form,
  disabled = false,
  onCustomChange,
  hideLabel = false,
  labelClassName = "",
}: RecordFieldProps) {
  const { control } = useFormContext() || { control: null };
  const [value, setValue] = useState<string>("");

  // Helper to handle change with custom handler
  const handleCustomChange = (value: any) => {
    if (onCustomChange) {
      onCustomChange(value);
    }
  };

  if (!control) {
    return (
      <div className="text-destructive">
        RecordField must be used within a FormProvider
      </div>
    );
  }

  const renderField = () => {
    switch (field.data_type) {
      case "textarea":
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && (
                  <FormLabel className={labelClassName}>
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                <FormControl>
                  <Textarea
                    {...formField}
                    onChange={e => {
                      formField.onChange(e);
                      handleCustomChange(e.target.value);
                    }}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "picklist":
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && (
                  <FormLabel className={labelClassName}>
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                <Select
                  value={formField.value || ""}
                  onValueChange={(value) => {
                    formField.onChange(value);
                    handleCustomChange(value);
                  }}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.values?.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "boolean":
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value === "true" || formField.value === true}
                    onCheckedChange={(checked) => {
                      const value = checked ? "true" : "false";
                      formField.onChange(value);
                      handleCustomChange(value);
                    }}
                    disabled={disabled}
                  />
                </FormControl>
                {!hideLabel && (
                  <FormLabel className={`font-normal ${labelClassName}`}>
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "lookup":
        // Handle lookup fields which need special treatment
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => {
              if (!field.options || typeof field.options !== "object" || !field.options.target_object_type_id) {
                return (
                  <FormItem>
                    {!hideLabel && (
                      <FormLabel className={labelClassName}>
                        {field.name}
                        {field.is_required && <span className="text-destructive ml-1">*</span>}
                      </FormLabel>
                    )}
                    <FormControl>
                      <Input
                        {...formField}
                        disabled={true}
                        placeholder="Invalid lookup field configuration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }

              return (
                <FormItem>
                  {!hideLabel && (
                    <FormLabel className={labelClassName}>
                      {field.name}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                  )}
                  <FormControl>
                    <div>
                      <LookupField
                        value={formField.value}
                        onChange={(value) => {
                          formField.onChange(value);
                          handleCustomChange(value);
                        }}
                        targetObjectTypeId={field.options.target_object_type_id}
                        disabled={disabled}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );

      case "date":
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && (
                  <FormLabel className={labelClassName}>
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                <FormControl>
                  <Input
                    {...formField}
                    type="date"
                    onChange={e => {
                      formField.onChange(e);
                      handleCustomChange(e.target.value);
                    }}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "email":
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && (
                  <FormLabel className={labelClassName}>
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                <FormControl>
                  <Input
                    {...formField}
                    type="email"
                    onChange={e => {
                      formField.onChange(e);
                      handleCustomChange(e.target.value);
                    }}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
      case "currency":
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && (
                  <FormLabel className={labelClassName}>
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                <FormControl>
                  <Input
                    {...formField}
                    type="number"
                    step={field.data_type === "currency" ? "0.01" : "1"}
                    onChange={e => {
                      formField.onChange(e);
                      handleCustomChange(e.target.value);
                    }}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      // Default case for text and other field types
      default:
        return (
          <FormField
            control={control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && (
                  <FormLabel className={labelClassName}>
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                <FormControl>
                  <Input
                    {...formField}
                    onChange={e => {
                      formField.onChange(e);
                      handleCustomChange(e.target.value);
                    }}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return renderField();
}
