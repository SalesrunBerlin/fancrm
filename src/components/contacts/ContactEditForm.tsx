
import { Contact } from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";

interface ContactEditFormProps {
  editedContact: Partial<Contact>;
  accounts: Array<{ id: string; name: string }>;
  onFieldChange: (field: keyof Contact, value: string) => void;
  onAddressBlur?: () => void;
  isAddressLoading?: boolean;
}

export function ContactEditForm({ editedContact, accounts, onFieldChange, onAddressBlur, isAddressLoading }: ContactEditFormProps) {
  const [addressChanged, setAddressChanged] = useState(false);
  const [showNoCoordinatesWarning, setShowNoCoordinatesWarning] = useState(false);
  
  const hasCompleteAddress = Boolean(
    editedContact.street && 
    editedContact.city && 
    editedContact.postal_code
  );

  // Reset address changed status when coordinates are successfully found
  useEffect(() => {
    if (editedContact.latitude && editedContact.longitude) {
      setAddressChanged(false);
      setShowNoCoordinatesWarning(false);
    }
  }, [editedContact.latitude, editedContact.longitude]);

  // Show warning after a delay if coordinates still missing
  useEffect(() => {
    if (addressChanged && hasCompleteAddress && !isAddressLoading) {
      const timer = setTimeout(() => {
        if (!editedContact.latitude && !editedContact.longitude) {
          setShowNoCoordinatesWarning(true);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [addressChanged, hasCompleteAddress, isAddressLoading, editedContact.latitude, editedContact.longitude]);
  
  const handleAddressChange = (field: keyof Contact, value: string) => {
    // When address fields change, mark address as changed and clear coordinates
    if (field === 'street' || field === 'city' || field === 'postal_code' || field === 'country') {
      setAddressChanged(true);
      setShowNoCoordinatesWarning(false);
    }
    onFieldChange(field, value);
  };

  const handleAddressFieldBlur = () => {
    if (hasCompleteAddress && onAddressBlur) {
      console.log("Address field blurred with complete address, triggering geocode");
      onAddressBlur();
    }
  };
  
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
            onChange={(e) => handleAddressChange('street', e.target.value)} 
            onBlur={handleAddressFieldBlur}
          />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input 
            value={editedContact.city || ''} 
            onChange={(e) => handleAddressChange('city', e.target.value)} 
            onBlur={handleAddressFieldBlur}
          />
        </div>
        <div className="space-y-2">
          <Label>Postal Code</Label>
          <Input 
            value={editedContact.postal_code || ''} 
            onChange={(e) => handleAddressChange('postal_code', e.target.value)} 
            onBlur={handleAddressFieldBlur}
          />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input 
            value={editedContact.country || 'Germany'} 
            onChange={(e) => handleAddressChange('country', e.target.value)} 
            onBlur={handleAddressFieldBlur}
          />
        </div>
        
        {isAddressLoading && (
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Verifying address...
          </div>
        )}
        
        {editedContact.latitude && editedContact.longitude && (
          <div className="flex items-center text-xs text-green-600 mt-2">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Coordinates found: {Number(editedContact.latitude).toFixed(6)}, {Number(editedContact.longitude).toFixed(6)}
          </div>
        )}
        
        {showNoCoordinatesWarning && (
          <Alert variant="destructive" className="mt-2 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription className="text-xs">
              Could not get coordinates for this address. There may be an API key issue or the address cannot be found.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
