
import { useFormContext } from "react-hook-form";
import { 
  FormField,
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { LookupField } from "./LookupField";

interface RecordFieldProps {
  field: {
    name: string;
    api_name: string;
    data_type: string;
    is_required?: boolean;
    options?: any;
  };
  hideLabel?: boolean;
  form?: any;
}

export function RecordField({ field, hideLabel = false, form }: RecordFieldProps) {
  const methods = useFormContext();
  const formMethods = form || methods;

  // Ensure we have a valid form context
  if (!formMethods) {
    console.error("RecordField must be used within a FormProvider or passed a form prop");
    return null;
  }

  // Create a render function for each field type
  const renderField = () => {
    const isRequired = field.is_required;
    
    switch (field.data_type) {
      case "text": 
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Textarea 
                    {...formField}
                    rows={4}
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
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input 
                    {...formField} 
                    type="email" 
                    placeholder="email@example.com" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "url":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input 
                    {...formField} 
                    type="url" 
                    placeholder="https://example.com" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input 
                    {...formField} 
                    type="number" 
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number(e.target.value);
                      formField.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "currency":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input 
                      {...formField} 
                      type="number"
                      className="pl-7" 
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value);
                        formField.onChange(value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "percentage":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <div className="relative">
                    <Input 
                      {...formField} 
                      type="number"
                      className="pr-7" 
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value);
                        formField.onChange(value);
                      }}
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "date":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input 
                    {...formField} 
                    type="date" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "time":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input 
                    {...formField} 
                    type="time" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "datetime":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input 
                    {...formField} 
                    type="datetime-local" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "checkbox":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0 p-1")}>
                <FormControl>
                  <Checkbox
                    checked={formField.value === "true" || formField.value === true}
                    onCheckedChange={(checked) => {
                      formField.onChange(checked ? "true" : "false");
                    }}
                  />
                </FormControl>
                {!hideLabel && <FormLabel className="font-normal">{field.name}</FormLabel>}
              </FormItem>
            )}
          />
        );

      case "toggle":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-center justify-between p-1">
                {!hideLabel && <FormLabel>{field.name}</FormLabel>}
                <FormControl>
                  <Switch
                    checked={formField.value === "true" || formField.value === true}
                    onCheckedChange={(checked) => {
                      formField.onChange(checked ? "true" : "false");
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case "picklist":
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <Select 
                  onValueChange={formField.onChange}
                  value={formField.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.values?.map((option: { value: string, label: string }) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "lookup":
        let targetObjectTypeId = '';
        
        // Extract target object ID from options
        if (field.options) {
          if (typeof field.options === 'string') {
            try {
              const parsedOptions = JSON.parse(field.options);
              targetObjectTypeId = parsedOptions.target_object_type_id || '';
            } catch (e) {
              console.error("Error parsing lookup field options:", e);
            }
          } else if (typeof field.options === 'object') {
            targetObjectTypeId = field.options.target_object_type_id || '';
          }
        }

        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <LookupField
                    value={formField.value}
                    onChange={formField.onChange}
                    targetObjectTypeId={targetObjectTypeId}
                    disabled={formField.disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <FormField
            control={formMethods.control}
            name={field.api_name}
            render={({ field: formField }) => (
              <FormItem>
                {!hideLabel && <FormLabel>{field.name}{isRequired && " *"}</FormLabel>}
                <FormControl>
                  <Input {...formField} />
                </FormControl>
                <FormDescription className="text-xs">
                  Unsupported field type: {field.data_type}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return renderField();
}
