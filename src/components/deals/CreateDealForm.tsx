
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useContacts } from "@/hooks/useContacts";
import { useCreateDealForm } from "@/hooks/useCreateDealForm";
import { DealAssociationTypeSelect } from "./DealAssociationTypeSelect";
import { useDealStatuses } from "@/hooks/useDealStatuses";

interface CreateDealFormProps {
  onSuccess: () => void;
}

export function CreateDealForm({ onSuccess }: CreateDealFormProps) {
  const { data: accounts } = useAccounts();
  const { data: contacts } = useContacts();
  const { form, isLoading, associationType, setAssociationType, onSubmit } = useCreateDealForm({ onSuccess });
  const { dealStatuses, isLoading: statusLoading } = useDealStatuses();

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Deal Name eingeben" />
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
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
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
                    <SelectValue placeholder={statusLoading ? "Lädt..." : "Status auswählen"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dealStatuses && dealStatuses.length > 0 ? (
                    dealStatuses.map((status: any) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Keine Status vorhanden
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DealAssociationTypeSelect
          value={associationType}
          onChange={setAssociationType}
        />
        {associationType === 'account' ? (
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Account auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kontakt</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kontakt auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {`${contact.firstName} ${contact.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess()}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Erstelle..." : "Deal erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
