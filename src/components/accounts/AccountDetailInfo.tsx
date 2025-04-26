import { Account } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, X } from "lucide-react";
import { AddressMap } from "@/components/common/AddressMap";

interface AccountDetailInfoProps {
  account: Account;
  isEditing: boolean;
  editedAccount: Partial<Account>;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onEditFieldChange: (field: keyof Account, value: string) => void;
}

export function AccountDetailInfo({
  account,
  isEditing,
  editedAccount,
  onEdit,
  onCancelEdit,
  onSave,
  onEditFieldChange,
}: AccountDetailInfoProps) {
  const fullAddress = account.street && account.city && account.postal_code
    ? `${account.street}, ${account.postal_code} ${account.city}, ${account.country || 'Germany'}`
    : null;

  const hasAddressData = !!(account.street || account.city || account.postal_code || account.country);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Account Details</CardTitle>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="outline" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={onCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={onSave}>Save</Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <strong>Name:</strong> {account.name}
            </div>
            <div>
              <strong>Type:</strong> {account.type || 'Not specified'}
            </div>
            <div>
              <strong>Website:</strong> {account.website || 'No website'}
            </div>
            <div>
              <strong>Industry:</strong> {account.industry || 'Not specified'}
            </div>
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold mb-2">Address</h3>
                  <div>
                    <strong>Street:</strong> {account.street || 'Not specified'}
                  </div>
                  <div>
                    <strong>City:</strong> {account.city || 'Not specified'}
                  </div>
                  <div>
                    <strong>Postal Code:</strong> {account.postal_code || 'Not specified'}
                  </div>
                  <div>
                    <strong>Country:</strong> {account.country || 'Germany'}
                  </div>
                </div>
                {hasAddressData && (
                  <div className="relative h-[250px]">
                    <h3 className="text-lg font-semibold mb-2">Location</h3>
                    <div className="absolute inset-0 top-10">
                      <AddressMap 
                        latitude={account.latitude} 
                        longitude={account.longitude}
                        address={fullAddress || undefined}
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label>Name</label>
              <Input 
                value={editedAccount.name || ''} 
                onChange={(e) => onEditFieldChange('name', e.target.value)} 
              />
            </div>
            <div>
              <label>Type</label>
              <Input 
                value={editedAccount.type || ''} 
                onChange={(e) => onEditFieldChange('type', e.target.value)} 
              />
            </div>
            <div>
              <label>Website</label>
              <Input 
                value={editedAccount.website || ''} 
                onChange={(e) => onEditFieldChange('website', e.target.value)} 
              />
            </div>
            <div>
              <label>Industry</label>
              <Input 
                value={editedAccount.industry || ''} 
                onChange={(e) => onEditFieldChange('industry', e.target.value)} 
              />
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-2">Address</h3>
              <div className="space-y-4">
                <div>
                  <label>Street</label>
                  <Input 
                    value={editedAccount.street || ''} 
                    onChange={(e) => onEditFieldChange('street', e.target.value)} 
                  />
                </div>
                <div>
                  <label>City</label>
                  <Input 
                    value={editedAccount.city || ''} 
                    onChange={(e) => onEditFieldChange('city', e.target.value)} 
                  />
                </div>
                <div>
                  <label>Postal Code</label>
                  <Input 
                    value={editedAccount.postal_code || ''} 
                    onChange={(e) => onEditFieldChange('postal_code', e.target.value)} 
                  />
                </div>
                <div>
                  <label>Country</label>
                  <Input 
                    value={editedAccount.country || 'Germany'} 
                    onChange={(e) => onEditFieldChange('country', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
