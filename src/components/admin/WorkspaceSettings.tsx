import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemedButton } from '@/components/ui/themed-button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';

interface WorkspaceSettingsProps {
  workspaceId: string;
}

export function WorkspaceSettings({ workspaceId }: WorkspaceSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workspace, setWorkspace] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#6B8AFE');

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();
          
        if (error) throw error;
        
        setWorkspace(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setWelcomeMessage(data.welcome_message || '');
        setIsActive(data.is_active);
        setPrimaryColor(data.primary_color || '#6B8AFE');
      } catch (error) {
        console.error('Error fetching workspace:', error);
        toast.error('Fehler beim Laden der Workspace-Einstellungen');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkspace();
  }, [workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Bitte geben Sie einen Namen für den Workspace an.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          name,
          description,
          welcome_message: welcomeMessage,
          is_active: isActive,
          primary_color: primaryColor
        })
        .eq('id', workspaceId);
        
      if (error) throw error;
      
      toast.success('Workspace-Einstellungen wurden erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Fehler beim Aktualisieren der Workspace-Einstellungen');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Willkommensnachricht</Label>
            <Textarea 
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              disabled={isSaving}
              rows={3}
              placeholder="Willkommensnachricht für neue Benutzer"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primäre Farbe</Label>
            <ColorPicker 
              color={primaryColor}
              onChange={setPrimaryColor}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSaving}
            />
            <Label htmlFor="isActive">Workspace aktiv</Label>
          </div>
          
          <div className="flex justify-end pt-4">
            <ThemedButton 
              type="submit"
              disabled={isSaving || !name}
              useUserColor={true}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Änderungen speichern
            </ThemedButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
