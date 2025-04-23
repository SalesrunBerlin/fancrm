
import { Contact } from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ContactEditFormProps {
  editedContact: Partial<Contact>;
  accounts: Array<{ id: string; name: string }>;
  onFieldChange: (field: keyof Contact, value: string) => void;
  onAddressBlur?: () => void;
  isAddressLoading?: boolean;
}

export function ContactEditForm({ editedContact, accounts, onFieldChange, onAddressBlur, isAddressLoading }: ContactEditFormProps) {
  const hasCompleteAddress = Boolean(
    editedContact.street && 
    editedContact.city && 
    editedContact.postal_code
  );
  
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
      
      {/* Address input */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-2">Address</h3>
        <div className="space-y-2">
          <Label>Street</Label>
          <Input 
            value={editedContact.street || ''} 
            onChange={(e) => onFieldChange('street', e.target.value)} 
            onBlur={hasCompleteAddress ? onAddressBlur : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input 
            value={editedContact.city || ''} 
            onChange={(e) => onFieldChange('city', e.target.value)} 
            onBlur={hasCompleteAddress ? onAddressBlur : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label>Postal Code</Label>
          <Input 
            value={editedContact.postal_code || ''} 
            onChange={(e) => onFieldChange('postal_code', e.target.value)} 
            onBlur={hasCompleteAddress ? onAddressBlur : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input 
            value={editedContact.country || 'Germany'} 
            onChange={(e) => onFieldChange('country', e.target.value)} 
            onBlur={hasCompleteAddress ? onAddressBlur : undefined}
          />
        </div>
        
        {isAddressLoading && (
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Verifying address...
          </div>
        )}
        
        {editedContact.latitude && editedContact.longitude && (
          <p className="text-xs text-green-600 mt-2">
            Coordinates found: {Number(editedContact.latitude).toFixed(6)}, {Number(editedContact.longitude).toFixed(6)}
          </p>
        )}
        
        {hasCompleteAddress && !editedContact.latitude && !editedContact.longitude && !isAddressLoading && (
          <p className="text-xs text-amber-600 mt-2">
            Click save to geocode this address
          </p>
        )}
      </div>
    </div>
  );
}
