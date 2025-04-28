
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchData } from "@/lib/mockData";

interface Option {
  id: string;
  name: string;
}

interface ActivityDealSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ActivityDealSelect({ value, onChange, disabled = false }: ActivityDealSelectProps) {
  const [deals, setDeals] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeals = async () => {
      setIsLoading(true);
      try {
        const fetchedDeals = await fetchData("deals", "id, name");
        if (Array.isArray(fetchedDeals)) {
          setDeals(fetchedDeals as Option[]);
        } else {
          console.error("Deals data is not an array:", fetchedDeals);
          setDeals([]);
        }
      } catch (error) {
        console.error("Error loading deals:", error);
        setDeals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeals();
  }, []);

  return (
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Opportunity auswählen" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Lädt...
          </SelectItem>
        ) : deals.length === 0 ? (
          <SelectItem value="none" disabled>
            Keine Opportunities verfügbar
          </SelectItem>
        ) : (
          deals.map((deal) => (
            <SelectItem key={deal.id} value={deal.id}>
              {deal.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
