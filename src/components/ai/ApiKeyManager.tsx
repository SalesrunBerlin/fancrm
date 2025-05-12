
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOpenAI } from '@/hooks/useOpenAI';
import { Loader2, Key, Shield, AlertTriangle } from 'lucide-react';

export function ApiKeyManager() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { hasApiKey, isLoading, storeApiKey, deleteApiKey } = useOpenAI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim().startsWith('sk-')) {
      alert('Please enter a valid OpenAI API key. It should start with "sk-"');
      return;
    }
    
    await storeApiKey(apiKey);
    setApiKey('');
  };

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    
    await deleteApiKey();
    setIsConfirmingDelete(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          {hasApiKey
            ? 'Your OpenAI API key is securely stored'
            : 'Add your OpenAI API key to use AI features'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasApiKey ? (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>API Key is stored securely</AlertTitle>
            <AlertDescription>
              Your API key is encrypted and stored securely. You will be charged by OpenAI based on your usage.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Your API key will be encrypted and stored in our database. However, you are responsible for any charges from OpenAI.
                </AlertDescription>
              </Alert>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showKey ? "Hide" : "Show"}
                </Button>
              </div>
              <Button type="submit" disabled={isLoading || !apiKey.trim()} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save API Key</>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      {hasApiKey && (
        <CardFooter>
          <Button
            variant={isConfirmingDelete ? "destructive" : "outline"}
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isConfirmingDelete ? (
              <>Confirm Removal</>
            ) : (
              <>Remove API Key</>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
