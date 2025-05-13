import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CopyIcon, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PublicActionToken } from "@/types"; // Import from @/types now that it's defined

interface ActionSharingDialogProps {
  actionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActionSharingDialog({ actionId, open, onOpenChange }: ActionSharingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [publicActionToken, setPublicActionToken] = useState<PublicActionToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenActive, setIsTokenActive] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchPublicActionToken = async () => {
      if (!actionId) return;
      setIsLoading(true);
      try {
        const { data: existingToken, error } = await supabase
          .from('public_action_tokens')
          .select('*')
          .eq('action_id', actionId)
          .single();

        if (error) {
          console.error("Error fetching public action token:", error);
          return;
        }

        if (existingToken) {
          setPublicActionToken(existingToken);
          setIsTokenActive(existingToken.is_active);
          if (existingToken.expires_at) {
            setExpiryDate(new Date(existingToken.expires_at));
          } else {
            setExpiryDate(null);
          }
          generatePublicUrl(existingToken.token);
        } else {
          setPublicActionToken(null);
          setIsTokenActive(false);
          setExpiryDate(null);
          setPublicUrl(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicActionToken();
  }, [actionId]);

  const generatePublicUrl = (token: string) => {
    if (!token) {
      setPublicUrl(null);
      return;
    }
    const baseUrl = window.location.origin;
    setPublicUrl(`${baseUrl}/actions/public/${token}`);
  };

  const handleTokenToggle = async (checked: boolean) => {
    if (!actionId) return;
    setIsLoading(true);
    try {
      if (!publicActionToken) {
        // Create a new token
        const { data: newToken, error: createError } = await supabase
          .from('public_action_tokens')
          .insert([{ action_id: actionId, is_active: true }])
          .select('*')
          .single();

        if (createError) throw createError;

        setPublicActionToken(newToken);
        setIsTokenActive(true);
        generatePublicUrl(newToken.token);
        toast({
          title: "Public action link enabled.",
          description: "Anyone with the link can access this action.",
        });
      } else {
        // Update the existing token
        const { data: updatedToken, error: updateError } = await supabase
          .from('public_action_tokens')
          .update({ is_active: checked })
          .eq('id', publicActionToken.id)
          .select('*')
          .single();

        if (updateError) throw updateError;

        setPublicActionToken(updatedToken);
        setIsTokenActive(checked);
        generatePublicUrl(updatedToken.token);
        toast({
          title: checked ? "Public action link enabled." : "Public action link disabled.",
          description: checked ? "Anyone with the link can access this action." : "The public link is no longer active.",
        });
      }
    } catch (error: any) {
      console.error("Error toggling token:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update public action link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyClick = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Copied!",
        description: "Public action link copied to clipboard.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Action</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="public-link">Public Link</Label>
            <div className="flex items-center">
              <Input
                id="public-link"
                className="mr-2"
                value={publicUrl || "Generate link to share"}
                readOnly
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyClick}
                disabled={!publicUrl}
              >
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="public-switch">Enable Public Link</Label>
            <Switch
              id="public-switch"
              checked={isTokenActive}
              onCheckedChange={handleTokenToggle}
              disabled={isLoading}
            />
          </div>
          {publicActionToken && (
            <div className="text-sm text-muted-foreground">
              <p>
                This public link has been viewed {publicActionToken.views_count} times and has {publicActionToken.submissions_count} submissions.
              </p>
              {expiryDate && (
                <p>
                  This link will expire on {format(expiryDate, "MMMM dd, yyyy")}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
