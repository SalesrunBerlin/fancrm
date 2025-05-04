
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useRecordShares, RecordShare } from '@/hooks/useRecordShares';
import { UserSearchField } from './UserSearchField';
import { FieldSelectionList } from './FieldSelectionList';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trash2, Edit2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ShareRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
  objectTypeId: string;
}

export function ShareRecordSheet({
  open,
  onOpenChange,
  recordId,
  objectTypeId
}: ShareRecordSheetProps) {
  const [activeTab, setActiveTab] = useState<string>('share');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissionLevel, setPermissionLevel] = useState<'read' | 'edit'>('read');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { 
    shares, 
    shareFields, 
    shareRecord, 
    updateShare, 
    removeShare, 
    isLoading: isLoadingShares 
  } = useRecordShares(recordId);

  // Reset form when the sheet is opened
  useEffect(() => {
    if (open) {
      setSelectedUserId('');
      setPermissionLevel('read');
      setSelectedFields([]);
      setActiveTab('share');
    }
  }, [open]);

  // Update selected fields when fields are loaded
  useEffect(() => {
    if (fields && fields.length > 0 && selectedFields.length === 0) {
      const defaultFields = fields.map(field => field.api_name);
      setSelectedFields(defaultFields);
    }
  }, [fields]);

  const handleShare = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user to share with');
      return;
    }
    
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to share');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await shareRecord.mutateAsync({
        recordId,
        sharedWithUserId: selectedUserId,
        permissionLevel,
        visibleFields: selectedFields
      });
      
      setSelectedUserId('');
      setActiveTab('manage');
    } catch (error) {
      console.error('Error sharing record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateShare = async (shareId: string, newPermissionLevel: 'read' | 'edit') => {
    try {
      await updateShare.mutateAsync({
        shareId,
        permissionLevel: newPermissionLevel
      });
    } catch (error) {
      console.error('Error updating share:', error);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await removeShare.mutateAsync(shareId);
    } catch (error) {
      console.error('Error removing share:', error);
    }
  };

  const isLoading = isLoadingFields || isLoadingShares;
  
  // Function to get initials from user profile
  const getUserInitials = (profile: RecordShare['user_profile']) => {
    if (!profile) return '??';
    
    const firstInitial = profile.first_name ? profile.first_name.charAt(0) : '';
    const lastInitial = profile.last_name ? profile.last_name.charAt(0) : '';
    
    return (firstInitial + lastInitial).toUpperCase() || profile.screen_name?.charAt(0).toUpperCase() || '?';
  };
  
  // Function to get display name from user profile
  const getUserDisplayName = (profile: RecordShare['user_profile']) => {
    if (!profile) return 'Unknown User';
    
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    
    return profile.screen_name || 'User';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share Record</SheetTitle>
          <SheetDescription>
            Share this record with other users and control which fields they can see.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="share" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="share" className="space-y-6 pt-4">
            <div className="space-y-4">
              <UserSearchField
                selectedUserId={selectedUserId}
                onSelect={setSelectedUserId}
                label="Select User"
                description="Search for a user to share this record with"
              />
              
              {selectedUserId && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Permission Level</Label>
                    <RadioGroup 
                      defaultValue="read" 
                      value={permissionLevel}
                      onValueChange={(value) => setPermissionLevel(value as 'read' | 'edit')}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="read" id="read" />
                        <Label htmlFor="read" className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                          Read only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="edit" id="edit" />
                        <Label htmlFor="edit" className="flex items-center">
                          <Edit2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          Can edit
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Visible Fields</Label>
                    <p className="text-sm text-muted-foreground">
                      Select which fields this user will be able to see
                    </p>
                    
                    {isLoading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <FieldSelectionList
                        fields={fields || []}
                        selectedFields={selectedFields}
                        onChange={setSelectedFields}
                      />
                    )}
                  </div>
                  
                  <Button
                    className="w-full mt-4"
                    onClick={handleShare}
                    disabled={isSubmitting || !selectedUserId || selectedFields.length === 0}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Share Record
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-6 pt-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : shares && shares.length > 0 ? (
              <div className="space-y-4">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-start justify-between p-3 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={share.user_profile?.avatar_url || undefined} />
                        <AvatarFallback>{getUserInitials(share.user_profile)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getUserDisplayName(share.user_profile)}</p>
                        <p className="text-sm text-muted-foreground">
                          {share.permission_level === 'read' ? 'Read access' : 'Edit access'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {shareFields && shareFields[share.id] ? (
                            `${shareFields[share.id].length} fields visible`
                          ) : (
                            'Loading fields...'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateShare(
                          share.id,
                          share.permission_level === 'read' ? 'edit' : 'read'
                        )}
                        title={share.permission_level === 'read' ? 'Change to edit access' : 'Change to read access'}
                      >
                        {share.permission_level === 'read' ? (
                          <Edit2 className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Remove access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>No shares yet</p>
                <p className="text-sm">Share this record with others using the Share tab</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab('share')}
                >
                  Share Now
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
