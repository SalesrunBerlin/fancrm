import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Check, Loader2, XCircle } from "lucide-react";
import { useActions } from "@/hooks/useActions";
import { Switch } from "@/components/ui/switch";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicActionToken } from "@/types";

interface ActionSharingDialogProps {
  actionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tokenFormSchema = z.object({
  tokenName: z.string().min(1, "Token name is required"),
  expiration: z.enum(["1", "7", "30", "never"]).default("never"),
});

export function ActionSharingDialog({ actionId, open, onOpenChange }: ActionSharingDialogProps) {
  const { createPublicToken, getActionTokens, deactivateToken } = useActions();
  const [selectedToken, setSelectedToken] = useState<PublicActionToken | null>(null);
  const [tokens, setTokens] = useState<PublicActionToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'create' | 'success'>('initial');
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof tokenFormSchema>>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      tokenName: 'Public Link',
      expiration: 'never',
    },
  });
  
  const { control, handleSubmit, setValue, watch } = form;
  const tokenName = watch("tokenName");
  const expiration = watch("expiration");

  useEffect(() => {
    if (open) {
      loadTokens();
      setStep('initial');
      setSelectedToken(null);
      form.reset();
    }
  }, [open, actionId, form]);

  const loadTokens = async () => {
    try {
      setIsLoading(true);
      const tokensData = await getActionTokens(actionId);
      setTokens(tokensData);
    } catch (err: any) {
      setError("Failed to load tokens");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let expiryDate: Date | undefined = undefined;
      if (expiration !== 'never') {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expiration));
      }
      
      const token = await createPublicToken.mutateAsync({
        actionId,
        name: tokenName || 'Public Link',
        expiresAt: expiryDate
      });
      
      setTokens(prev => [...prev, token]);
      setSelectedToken(token);
      setStep('success');
    } catch (err: any) {
      console.error("Error creating token:", err);
      setError(err.message || "Failed to create token");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateToken = async (tokenId: string) => {
    try {
      await deactivateToken.mutateAsync(tokenId);
      setSelectedToken(null);
      // Refresh tokens list
      loadTokens();
    } catch (err: any) {
      console.error("Error deactivating token:", err);
      setError(err.message || "Failed to deactivate token");
    }
  };

  const handleCopyClick = () => {
    if (selectedToken) {
      const baseUrl = window.location.origin;
      const publicLink = `${baseUrl}/public/action/${selectedToken.token}`;
      navigator.clipboard.writeText(publicLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error("Failed to copy link:", err);
          toast.error("Failed to copy link to clipboard.");
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Action</DialogTitle>
          <DialogDescription>
            Create a public link for this action to share with others.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-100 p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {step === 'initial' && (
              <div className="grid gap-4 py-4">
                {tokens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No public links have been created for this action yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="tokens">Existing Links</Label>
                    <ul className="list-none pl-0 space-y-1">
                      {tokens.map(token => (
                        <li key={token.id} className="flex items-center justify-between p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors cursor-pointer" onClick={() => setSelectedToken(token)}>
                          <span>{token.name || 'Public Link'}</span>
                          <span className="text-xs text-muted-foreground">Created: {new Date(token.created_at).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button onClick={() => setStep('create')}>Create New Link</Button>
              </div>
            )}

            {step === 'create' && (
              <div className="grid gap-4 py-4">
                <FormField
                  control={control}
                  name="tokenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Public Link" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="expiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expiration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 'success' && selectedToken && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="public-link">Public Link</Label>
                  <div className="flex items-center">
                    <Input
                      id="public-link"
                      className="cursor-not-allowed"
                      value={`${window.location.origin}/public/action/${selectedToken.token}`}
                      disabled
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={handleCopyClick}
                      disabled={copied}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share this link with anyone to allow them to use this action.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          {step === 'initial' && tokens.length > 0 && selectedToken ? (
            <>
              <Button variant="destructive" disabled={isLoading} onClick={() => handleDeactivateToken(selectedToken.id)}>
                Deactivate Link
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
            </>
          ) : step === 'create' ? (
            <>
              <Button type="button" variant="outline" onClick={() => setStep('initial')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} onClick={handleSubmit(createNewToken)}>
                Create Link
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
