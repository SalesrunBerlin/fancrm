
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemedButton } from '@/components/ui/themed-button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CopyIcon, CheckIcon } from 'lucide-react';

interface WorkspaceSettingsProps {
  workspaceId: string;
}

export function WorkspaceSettings({ workspaceId }: WorkspaceSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workspace, setWorkspace] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    welcome_message: '',
    primary_color: '#3b82f6',
  });

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  const fetchWorkspaceData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (error) throw error;
      
      setWorkspace(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        welcome_message: data.welcome_message || 'Willkommen! Bitte geben Sie Ihre Zugangsdaten ein, um auf den Workspace zuzugreifen.',
        primary_color: data.primary_color || '#3b82f6',
      });
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      toast({
        title: 'Fehler',
        description: 'Workspace-Daten konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: formData.name,
          description: formData.description,
          welcome_message: formData.welcome_message,
          primary_color: formData.primary_color,
          updated_at: new Date(),
        })
        .eq('id', workspaceId);

      if (error) throw error;
      
      toast({
        title: 'Gespeichert',
        description: 'Workspace-Einstellungen wurden aktualisiert',
      });
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: 'Fehler',
        description: 'Workspace-Einstellungen konnten nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getLoginUrl = () => {
    const origin = window.location.origin;
    return `${origin}/auth/${workspaceId}`;
  };

  const copyLoginUrl = () => {
    navigator.clipboard.writeText(getLoginUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace-Einstellungen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace-Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="welcome_message">Willkommensnachricht</Label>
            <Input
              id="welcome_message"
              name="welcome_message"
              value={formData.welcome_message}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primärfarbe</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={handleChange}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.primary_color}
                onChange={handleChange}
                name="primary_color"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loginUrl">Login-URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="loginUrl"
                value={getLoginUrl()}
                readOnly
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={copyLoginUrl}
                className="h-10 w-10"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Diese URL können Sie an Ihre Benutzer weitergeben, damit sie sich direkt in Ihrem Workspace anmelden können.
            </p>
          </div>
          
          <ThemedButton type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              'Speichern'
            )}
          </ThemedButton>
        </form>
      </CardContent>
    </Card>
  );
}
