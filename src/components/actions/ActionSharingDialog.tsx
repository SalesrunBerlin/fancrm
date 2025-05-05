
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Copy, Link, Share2, Trash } from "lucide-react";
import { toast } from "sonner";
import { useActions } from "@/hooks/useActions";
import { useAuth } from "@/contexts/AuthContext";
import { PublicActionToken } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface ActionSharingDialogProps {
  actionId: string;
  actionName: string;
  isPublic: boolean;
  onPublicToggle: (isPublic: boolean) => void;
}

export function ActionSharingDialog({ 
  actionId, 
  actionName, 
  isPublic, 
  onPublicToggle 
}: ActionSharingDialogProps) {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<PublicActionToken[]>([]);
  const [tokenName, setTokenName] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { createPublicToken, getActionTokens, deactivateToken } = useActions();

  const fetchTokens = async () => {
    if (actionId && isPublic) {
      const fetchedTokens = await getActionTokens(actionId);
      setTokens(fetchedTokens);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTokens();
    }
  }, [open, actionId, isPublic]);

  const handleCreateToken = async () => {
    if (!user || !actionId) return;
    
    try {
      setIsLoading(true);
      await createPublicToken.mutateAsync({
        actionId,
        name: tokenName || undefined,
        expiresAt: date
      });
      
      setTokenName("");
      setDate(undefined);
      fetchTokens();
    } catch (error) {
      console.error("Error creating token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateToken = async (tokenId: string) => {
    if (!user) return;
    
    try {
      await deactivateToken.mutateAsync(tokenId);
      fetchTokens();
    } catch (error) {
      console.error("Error deactivating token:", error);
    }
  };

  const copyToClipboard = (token: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/public-action/${token}`;
    
    navigator.clipboard.writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(err => {
        console.error("Failed to copy link:", err);
        toast.error("Failed to copy link");
      });
  };

  // Fixed toggle handler to prevent event propagation issues
  const handleToggleChange = (checked: boolean) => {
    onPublicToggle(checked);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share Action: {actionName}</DialogTitle>
          <DialogDescription>
            Create a public link to allow anyone to submit data using this action.
          </DialogDescription>
        </DialogHeader>
        
        {/* Fixed switch implementation with better accessibility */}
        <div className="flex items-center space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="public-action-toggle" 
              checked={isPublic}
              onCheckedChange={handleToggleChange}
            />
            <Label 
              htmlFor="public-action-toggle" 
              className="cursor-pointer"
            >
              Make this action publicly available
            </Label>
          </div>
        </div>
        
        {isPublic && (
          <>
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-medium">Public links</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage shareable links for this action.
                </p>
              </div>
              
              <div className="grid gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Link name (optional)"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="col-span-2"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Expires on...</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={handleCreateToken} disabled={isLoading}>
                  Create Public Link
                </Button>
              </div>
              
              <div className="space-y-2 mt-4">
                {tokens.length > 0 ? (
                  tokens.map(token => (
                    <Card key={token.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center">
                            <Link className="h-4 w-4 mr-2" />
                            {token.name || 'Unnamed link'}
                            {!token.is_active && (
                              <Badge variant="outline" className="ml-2">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Created: {new Date(token.created_at).toLocaleString()}
                          </div>
                          {token.expires_at && (
                            <div className="text-sm text-muted-foreground">
                              Expires: {new Date(token.expires_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(token.token)}
                            disabled={!token.is_active}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {token.is_active && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeactivateToken(token.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No public links created yet
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
