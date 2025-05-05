
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Copy, Link, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActions } from "@/hooks/useActions";
import { useAuth } from "@/contexts/AuthContext";
import { PublicActionToken } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { supabase } from "@/integrations/supabase/client";

export default function ActionSharingPage() {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<PublicActionToken[]>([]);
  const [tokenName, setTokenName] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<any>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { createPublicToken, getActionTokens, deactivateToken, updateAction } = useActions();

  // Get action details
  useEffect(() => {
    const fetchAction = async () => {
      if (!actionId) return;

      try {
        const { data, error } = await supabase
          .from("actions")
          .select("*")
          .eq("id", actionId)
          .single();

        if (error) throw error;
        setAction(data);
      } catch (err: any) {
        console.error("Error fetching action:", err);
        setError(err.message || "Failed to load action");
      } finally {
        setIsLoadingAction(false);
      }
    };

    fetchAction();
  }, [actionId]);

  const fetchTokens = async () => {
    if (actionId) {
      try {
        const fetchedTokens = await getActionTokens(actionId);
        setTokens(fetchedTokens);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setError("Failed to load sharing links");
      }
    }
  };

  useEffect(() => {
    if (!isLoadingAction && action) {
      fetchTokens();
    }
  }, [isLoadingAction, action, actionId]);

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
      toast.success("Sharing link created successfully");
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Failed to create sharing link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateToken = async (tokenId: string) => {
    if (!user) return;
    
    try {
      await deactivateToken.mutateAsync(tokenId);
      fetchTokens();
      toast.success("Link deactivated successfully");
    } catch (error) {
      console.error("Error deactivating token:", error);
      toast.error("Failed to deactivate link");
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

  const handleTogglePublic = async (checked: boolean) => {
    if (!actionId) return;
    
    try {
      await updateAction.mutateAsync({
        id: actionId,
        is_public: checked
      });
      
      // After successful update, update the local action state
      setAction(prev => ({ ...prev, is_public: checked }));
      toast.success(checked ? "Action is now public" : "Action is now private");
    } catch (err: any) {
      setError(err.message || "Failed to update public status");
      toast.error("Failed to update public status");
    }
  };

  if (isLoadingAction) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!action && !isLoadingAction) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Action not found"
          description="The requested action could not be found"
          backTo="/actions"
        />
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The action you are looking for might have been deleted or does not exist.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (action?.action_type !== "new_record") {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Action Sharing"
          description={`Sharing settings for: ${action?.name}`}
          backTo={`/actions/${actionId}`}
        />
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only "New Record" actions can be shared publicly.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Action Sharing"
        description={`Sharing settings for: ${action?.name}`}
        backTo={`/actions/${actionId}`}
      />

      {error && (
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Public Availability</CardTitle>
          <CardDescription>Make this action publicly available via sharing links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch 
              id="public-action-toggle" 
              checked={action?.is_public || false}
              onCheckedChange={handleTogglePublic}
            />
            <Label 
              htmlFor="public-action-toggle" 
              className="cursor-pointer"
            >
              Make this action publicly available
            </Label>
          </div>
        </CardContent>
      </Card>

      {action?.is_public && (
        <Card>
          <CardHeader>
            <CardTitle>Public Links</CardTitle>
            <CardDescription>Create and manage shareable links for this action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Link name (optional)"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="md:col-span-2"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="justify-start text-left font-normal w-full"
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
              <Button onClick={handleCreateToken} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Public Link"
                )}
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Active Links</h3>
              {tokens.length > 0 ? (
                <div className="space-y-4">
                  {tokens.map(token => (
                    <Card key={token.id}>
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-2">
                            <Link className="h-4 w-4" />
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
                        <div className="flex gap-2 self-end md:self-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyToClipboard(token.token)}
                            disabled={!token.is_active}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                          {token.is_active && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeactivateToken(token.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-muted/30 rounded-md">
                  <p className="text-muted-foreground">
                    No public links created yet
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
