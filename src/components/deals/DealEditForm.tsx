
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealType } from "@/types";
import { useDeals } from "@/hooks/useDeals";
import { useToast } from "@/hooks/use-toast";
import { useDealStatuses } from "@/hooks/useDealStatuses";

interface DealEditFormProps {
  deal: DealType;
  onSuccess: () => void;
}

export function DealEditForm({ deal, onSuccess }: DealEditFormProps) {
  const { updateDeal } = useDeals();
  const { toast } = useToast();
  const { dealStatuses, isLoading: statusLoading } = useDealStatuses();

  const form = useForm({
    defaultValues: {
      name: deal.name,
      amount: deal.amount.toString(),
      status: deal.status,
      closeDate: deal.closeDate || "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      // No need to validate the status against predefined values
      // Just use the selected status directly
      await updateDeal.mutateAsync({
        ...deal,
        name: values.name,
        amount: parseFloat(values.amount),
        status: values.status,
        closeDate: values.closeDate || null,
      });
      
      toast({
        title: "Erfolg",
        description: "Deal wurde aktualisiert",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error updating deal:", error);
      toast({
        title: "Fehler",
        description: "Deal konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Betrag</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={statusLoading ? "Lädt..." : "Wähle einen Status"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dealStatuses && dealStatuses.length > 0 ? (
                    dealStatuses.map((status: any) => (
                      <SelectItem key={status.id} value={status.name || "default-status"}>
                        {status.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Keine Status vorhanden
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="closeDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abschlussdatum</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit">Speichern</Button>
        </div>
      </form>
    </Form>
  );
}
