
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchData } from "@/lib/mockData";

interface Option {
  id: string;
  name: string;
}

interface ActivityAccountSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ActivityAccountSelect({ value, onChange, disabled = false }: ActivityAccountSelectProps) {
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true);
      try {
        const fetchedAccounts = await fetchData("accounts", "id, name");
        if (Array.isArray(fetchedAccounts)) {
          setAccounts(fetchedAccounts as Option[]);
        } else {
          console.error("Accounts data is not an array:", fetchedAccounts);
          setAccounts([]);
        }
      } catch (error) {
        console.error("Error loading accounts:", error);
        setAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  return (
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Account auswählen" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Lädt...
          </SelectItem>
        ) : accounts.length === 0 ? (
          <SelectItem value="none" disabled>
            Keine Accounts verfügbar
          </SelectItem>
        ) : (
          accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
