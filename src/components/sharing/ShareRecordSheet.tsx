
import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSearchField } from './UserSearchField';
import { FieldSelectionList } from './FieldSelectionList';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useRecordShares, RecordShare } from '@/hooks/useRecordShares';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trash2, Edit2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShareRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
  objectTypeId: string;
}

interface SelectedUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  screen_name: string | null;
  avatar_url: string | null;
}

export function ShareRecordSheet({
  open,
  onOpenChange,
  recordId,
  objectTypeId
}: ShareRecordSheetProps) {
  const [activeTab, setActiveTab] = useState('share');
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [permissionLevel, setPermissionLevel] = useState<'read' | 'edit'>('read');
  const [editingShare, setEditingShare] = useState<RecordShare | null>(null);
  const [shareToDelete, setShareToDelete] = useState<RecordShare | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const { fields, isLoading: fieldsLoading } = useObjectFields(objectTypeId);
  const { 
    shares, 
    shareFields, 
    isLoading: sharesLoading,
    shareRecord, 
    updateShare, 
    removeShare 
  } = useRecordShares(recordId);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setSelectedUser(null);
      setSelectedFields([]);
      setPermissionLevel('read');
      setEditingShare(null);
      setActiveTab('share');
    }
  }, [open]);

  // When editing a share, populate the form with its data
  useEffect(() => {
    if (editingShare && shareFields) {
      const fields = shareFields[editingShare.id] || [];
      const visibleFieldApiNames = fields.filter(f => f.is_visible).map(f => f.field_api_name);
      setSelectedFields(visibleFieldApiNames);
      setPermissionLevel(editingShare.permission_level);
      setSelectedUser({
        id: editingShare.shared_with_user_id,
        first_name: editingShare.user_profile?.first_name || null,
        last_name: editingShare.user_profile?.last_name || null,
        screen_name: editingShare.user_profile?.screen_name || null,
        avatar_url: editingShare.user_profile?.avatar_url || null
      });
      setActiveTab('share');
    }
  }, [editingShare, shareFields]);

  const handleShareRecord = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to share with');
      return;
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to share');
      return;
    }

    try {
      if (editingShare) {
        await updateShare.mutateAsync({
          shareId: editingShare.id,
          permissionLevel,
          visibleFields: selectedFields
        });
        setEditingShare(null);
      } else {
        await shareRecord.mutateAsync({
          recordId,
          sharedWithUserId: selectedUser.id,
          permissionLevel,
          visibleFields: selectedFields
        });
      }
      
      // Reset form after successful share
      setSelectedUser(null);
      setSelectedFields([]);
      setPermissionLevel('read');
      
      // Switch to the Manage tab to see the updated shares
      setActiveTab('manage');
    } catch (error) {
      console.error('Error sharing record:', error);
    }
  };

  const handleDeleteShare = async () => {
    if (!shareToDelete) return;
    
    try {
      await removeShare.mutateAsync(shareToDelete.id);
      setConfirmDialogOpen(false);
      setShareToDelete(null);
    } catch (error) {
      console.error('Error removing share:', error);
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'User';
    return user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.screen_name || 'User';
  };

  const getInitials = (user: any) => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return (user.screen_name?.[0] || 'U').toUpperCase();
  };

  const openConfirmDeleteDialog = (share: RecordShare) => {
    setShareToDelete(share);
    setConfirmDialogOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Share Record</SheetTitle>
            <SheetDescription>
              Share this record with other users in your organization.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="share">Share</TabsTrigger>
                <TabsTrigger value="manage">Manage Shares</TabsTrigger>
              </TabsList>
              
              <TabsContent value="share" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <UserSearchField
                    onSelect={setSelectedUser}
                    selectedUserId={selectedUser?.id}
                    placeholder="Select a user to share with"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Permission</Label>
                  <RadioGroup 
                    value={permissionLevel} 
                    onValueChange={(value) => setPermissionLevel(value as 'read' | 'edit')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="read" id="r-read" />
                      <Label htmlFor="r-read">Read only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="edit" id="r-edit" />
                      <Label htmlFor="r-edit">Edit</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Visible Fields</Label>
                  {fieldsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <FieldSelectionList
                      fields={fields || []}
                      selectedFields={selectedFields}
                      onChange={setSelectedFields}
                      defaultSelectAll={true}
                    />
                  )}
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleShareRecord}
                  disabled={!selectedUser || selectedFields.length === 0}
                >
                  {editingShare ? 'Update Share' : 'Share Record'}
                </Button>
              </TabsContent>
              
              <TabsContent value="manage" className="mt-4">
                {sharesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : shares && shares.length > 0 ? (
                  <div className="space-y-4">
                    {shares.map((share) => (
                      <div 
                        key={share.id} 
                        className="p-4 border rounded-md flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={share.user_profile?.avatar_url || undefined} 
                              alt={getDisplayName(share.user_profile)} 
                            />
                            <AvatarFallback>
                              {getInitials(share.user_profile)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {getDisplayName(share.user_profile)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {share.permission_level === 'read' ? 'Read only' : 'Can edit'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => setEditingShare(share)}
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => openConfirmDeleteDialog(share)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No shares found for this record.</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setActiveTab('share')}
                    >
                      Share with someone
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove share</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove access for {shareToDelete && getDisplayName(shareToDelete.user_profile)}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShare}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
