
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AutoNumberFieldConfigProps {
  form: UseFormReturn<any>;
}

export function AutoNumberFieldConfig({ form }: AutoNumberFieldConfigProps) {
  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/10">
      <h3 className="text-sm font-medium">Auto-Number Configuration</h3>
      
      <FormField
        control={form.control}
        name="options.auto_number_prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Prefix (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="CASE-" {...field} />
            </FormControl>
            <FormDescription>
              Text to appear before the number (e.g., "CASE-")
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="options.auto_number_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number Format</FormLabel>
            <FormControl>
              <Input placeholder="0000" {...field} />
            </FormControl>
            <FormDescription>
              Format pattern (e.g., "0000" for 4-digit numbers with leading zeros)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="options.auto_number_start"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Starting Number (Optional)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="1"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
              />
            </FormControl>
            <FormDescription>
              The first number in the sequence (defaults to 1)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
