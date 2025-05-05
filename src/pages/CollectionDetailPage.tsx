import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionShare, CollectionMember } from '@/types/RecordSharing';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserSearchField } from '@/components/sharing/UserSearchField';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCollections } from '@/hooks/useCollections';

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('members');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'read' | 'edit'>('read');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddRecordsOpen, setIsAddRecordsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const { useCollection, useCollectionMembers } = useCollections();

  // Fetch collection details
  const { data: collection, isLoading: isLoadingCollection } = useCollection(collectionId);
  
  // Fetch collection members
  const { data: members, isLoading: isLoadingMembers } = useCollectionMembers(collectionId);
  
  // Add a member to the collection using the edge function
  const addMember = useMutation({
    mutationFn: async () => {
      if (!user || !collectionId || !session) throw new Error('Missing required data');
      if (!selectedUserId) throw new Error('No user selected');
      
      setIsAddingMember(true);
      
      // Include the session token in the Authorization header
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: { 
          type: 'addMemberToCollection',
          collectionId,
          userId: selectedUserId,
          permissionLevel
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-members', collectionId] });
      setIsAddMemberOpen(false);
      setSelectedUserId('');
      setPermissionLevel('read');
      toast.success('Member added to collection');
    },
    onError: (error: any) => {
      toast.error('Failed to add member', {
        description: error.message
      });
    },
    onSettled: () => {
      setIsAddingMember(false);
    }
  });
  
  // Remove a member from the collection using the edge function
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!user || !collectionId || !session) throw new Error('Missing required data');
      
      // Include the session token in the Authorization header
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: {
          type: 'removeMemberFromCollection',
          collectionId,
          memberId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) throw error;
      return { memberId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-members', collectionId] });
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
      toast.success('Member removed from collection');
    },
    onError: (error: any) => {
      toast.error('Failed to remove member', {
        description: error.message
      });
    }
  });
  
  // Update member permissions using the edge function
  const updateMemberPermission = useMutation({
    mutationFn: async ({ memberId, newPermission }: { memberId: string, newPermission: 'read' | 'edit' }) => {
      if (!user || !collectionId || !session) throw new Error('Missing required data');
      
      // Include the session token in the Authorization header
      const { data, error } = await supabase.functions.invoke('collection-operations', {
        body: {
          type: 'updateMemberPermission',
          collectionId,
          memberId,
          permissionLevel: newPermission
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) throw error;
      return { memberId, newPermission };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-members', collectionId] });
      toast.success('Member permissions updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update permissions', {
        description: error.message
      });
    }
  });
  
  // Function to handle adding a new member
  const handleAddMember = async () => {
    try {
      await addMember.mutateAsync();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };
  
  // Function to confirm member deletion
  const confirmDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId);
    setIsDeleteDialogOpen(true);
  };
  
  // Function to handle member permission change
  const handlePermissionChange = (memberId: string, newPermission: 'read' | 'edit') => {
    updateMemberPermission.mutate({ memberId, newPermission });
  };

  // Helper function to get user initials
  const getUserInitials = (profile: any) => {
    if (!profile) return '??';
    
    const firstInitial = profile.first_name ? profile.first_name.charAt(0) : '';
    const lastInitial = profile.last_name ? profile.last_name.charAt(0) : '';
    
    return (firstInitial + lastInitial).toUpperCase() || profile.screen_name?.charAt(0).toUpperCase() || '?';
  };
  
  // Helper function to get display name
  const getUserDisplayName = (profile: any) => {
    if (!profile) return 'Unknown User';
    
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    
    return profile.screen_name || 'User';
  };
  
  const isLoading = isLoadingCollection || isLoadingMembers;

  return (
    <div className="space-y-6">
      <PageHeader
        title={collection?.name || 'Loading...'}
        description={collection?.description || 'Managing shared records'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/collections">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Collections
              </Link>
            </Button>
            <Button onClick={() => setIsAddMemberOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : collection ? (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="members">Members ({members?.length || 0})</TabsTrigger>
            <TabsTrigger value="records">Shared Records</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Members</CardTitle>
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.user_profile?.avatar_url || undefined} />
                                <AvatarFallback>{getUserInitials(member.user_profile)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{getUserDisplayName(member.user_profile)}</p>
                                {member.user_profile?.screen_name && (
                                  <p className="text-xs text-muted-foreground">@{member.user_profile.screen_name}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RadioGroup 
                              defaultValue={member.permission_level} 
                              className="flex space-x-4"
                              onValueChange={(value) => handlePermissionChange(member.id, value as 'read' | 'edit')}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="read" id={`read-${member.id}`} />
                                <Label htmlFor={`read-${member.id}`}>Read</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="edit" id={`edit-${member.id}`} />
                                <Label htmlFor={`edit-${member.id}`}>Edit</Label>
                              </div>
                            </RadioGroup>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 h-8 w-8 p-0"
                              onClick={() => confirmDeleteMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No members yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => setIsAddMemberOpen(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Your First Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Shared Records</CardTitle>
                <Button onClick={() => setIsAddRecordsOpen(true)}>
                  Add Records
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">This feature is still being implemented</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Soon you'll be able to add records to this collection
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Collection not found</h3>
            <p className="text-muted-foreground">
              The collection you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link to="/collections">Go to Collections</Link>
            </Button>
          </div>
        </Card>
      )}
      
      {/* Add Member Sheet */}
      <Sheet open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Member to Collection</SheetTitle>
            <SheetDescription>
              Invite a user to access the records in this collection.
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 py-6">
            <UserSearchField
              selectedUserId={selectedUserId}
              onSelect={setSelectedUserId}
              label="Select User"
              description="Search for a user to add to this collection"
            />
            
            {selectedUserId && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <RadioGroup 
                    defaultValue="read" 
                    value={permissionLevel}
                    onValueChange={(value) => setPermissionLevel(value as 'read' | 'edit')}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="read" id="read" />
                      <Label htmlFor="read">Read only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="edit" id="edit" />
                      <Label htmlFor="edit">Can edit</Label>
                    </div>
                  </RadioGroup>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {permissionLevel === 'read' 
                      ? 'User will only be able to view records in this collection.' 
                      : 'User will be able to view and edit records in this collection.'}
                  </p>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleAddMember}
                  disabled={isAddingMember}
                >
                  {isAddingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add to Collection
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the collection?
              They will no longer have access to any records shared in this collection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => memberToDelete && removeMember.mutate(memberToDelete)}
              disabled={!memberToDelete || removeMember.isPending}
            >
              {removeMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
