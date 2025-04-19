
import { FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DealAssociationTypeSelectProps {
  value: 'account' | 'contact';
  onChange: (value: 'account' | 'contact') => void;
}

export function DealAssociationTypeSelect({ value, onChange }: DealAssociationTypeSelectProps) {
  return (
    <div className="space-y-2">
      <FormLabel>Mit Account oder Kontakt verknüpfen</FormLabel>
      <RadioGroup
        value={value}
        onValueChange={(value: 'account' | 'contact') => onChange(value)}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="account" id="account" />
          <label htmlFor="account">Account</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="contact" id="contact" />
          <label htmlFor="contact">Kontakt</label>
        </div>
      </RadioGroup>
    </div>
  );
}
