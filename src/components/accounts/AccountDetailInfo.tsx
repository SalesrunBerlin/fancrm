
import { Account } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, X } from "lucide-react";

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
