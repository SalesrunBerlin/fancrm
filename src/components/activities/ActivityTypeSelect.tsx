
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const TYPES = [
  { value: "call", label: "Anruf" },
  { value: "task", label: "Aufgabe" },
  { value: "meeting", label: "Event/Meeting" },
  { value: "email", label: "E-Mail" },
];

export function ActivityTypeSelect({ value, onChange, disabled }: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Typ auswählen" />
      </SelectTrigger>
      <SelectContent>
        {TYPES.map(t => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
