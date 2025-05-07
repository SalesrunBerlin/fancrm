
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceInvitations } from "@/hooks/useWorkspaceInvitations";
import { Copy, Trash2 } from "lucide-react";

interface InvitationsListProps {
  workspaceId: string;
}

export function InvitationsList({ workspaceId }: InvitationsListProps) {
  const { invitations, isLoading, deleteInvitation } = useWorkspaceInvitations(workspaceId);

  const copyInvitationLink = (token: string) => {
    const baseUrl = window.location.origin;
    const invitationLink = `${baseUrl}/register/${token}`;
    
    navigator.clipboard.writeText(invitationLink);
    toast.success("Invitation link copied to clipboard");
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Loading invitations...
              </TableCell>
            </TableRow>
          ) : !invitations?.length ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No active invitations found
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {invitation.metadata_access && (
                      <Badge variant="outline" className="w-fit">Metadata</Badge>
                    )}
                    {invitation.data_access && (
                      <Badge variant="outline" className="w-fit">Data</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatExpiryDate(invitation.expires_at)}
                </TableCell>
                <TableCell>
                  {invitation.is_used ? (
                    <Badge>Used</Badge>
                  ) : isExpired(invitation.expires_at) ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {!invitation.is_used && !isExpired(invitation.expires_at) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyInvitationLink(invitation.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteInvitation.mutate(invitation.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
