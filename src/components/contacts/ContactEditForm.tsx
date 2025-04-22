
import { Contact } from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactEditFormProps {
  editedContact: Partial<Contact>;
  accounts: Array<{ id: string; name: string }>;
  onFieldChange: (field: keyof Contact, value: string) => void;
}

export function ContactEditForm({ editedContact, accounts, onFieldChange }: ContactEditFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input 
          value={editedContact.firstName || ''} 
          onChange={(e) => onFieldChange('firstName', e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input 
          value={editedContact.lastName || ''} 
          onChange={(e) => onFieldChange('lastName', e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input 
          value={editedContact.email || ''} 
          onChange={(e) => onFieldChange('email', e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input 
          value={editedContact.phone || ''} 
          onChange={(e) => onFieldChange('phone', e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label>Account</Label>
        <Select 
          value={editedContact.accountId || 'none'} 
          onValueChange={(value) => onFieldChange('accountId', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Account</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Address Fields */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-2">Address</h3>
        <div className="space-y-2">
          <Label>Street</Label>
          <Input 
            value={editedContact.street || ''} 
            onChange={(e) => onFieldChange('street', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input 
            value={editedContact.city || ''} 
            onChange={(e) => onFieldChange('city', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Postal Code</Label>
          <Input 
            value={editedContact.postal_code || ''} 
            onChange={(e) => onFieldChange('postal_code', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input 
            value={editedContact.country || 'Germany'} 
            onChange={(e) => onFieldChange('country', e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
}
