
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ThemedButton } from '@/components/ui/themed-button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkspaceInviteDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onInviteCreated: () => void;
}

export function WorkspaceInviteDialog({
  open,
  onClose,
  workspaceId,
  onInviteCreated
}: WorkspaceInviteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    metadata_access: true,
    data_access: false,
    expiry_days: '7',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase.functions.invoke('create-workspace-invitation', {
        body: {
          workspace_id: workspaceId,
          email: formData.email,
          metadata_access: formData.metadata_access,
          data_access: formData.data_access,
          expiry_days: parseInt(formData.expiry_days, 10)
        }
      });
      
      if (error) throw error;
      
      toast.success(`Einladung an ${formData.email} wurde erstellt`, {
        description: "Der Benutzer erhält einen Link zum Beitritt zum Workspace."
      });
      
      onInviteCreated();
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast.error('Fehler beim Erstellen der Einladung', {
        description: error.message || 'Bitte versuchen Sie es erneut.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Benutzer zum Workspace einladen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="benutzer@beispiel.de"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiry_days">Gültigkeitsdauer</Label>
            <Select 
              value={formData.expiry_days}
              onValueChange={(value) => handleSelectChange('expiry_days', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Gültigkeitsdauer wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Tag</SelectItem>
                <SelectItem value="3">3 Tage</SelectItem>
                <SelectItem value="7">7 Tage</SelectItem>
                <SelectItem value="14">14 Tage</SelectItem>
                <SelectItem value="30">30 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="text-sm font-medium">Berechtigungen:</div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="metadata_access"
                checked={formData.metadata_access}
                onCheckedChange={(checked) => handleSwitchChange('metadata_access', checked)}
              />
              <Label htmlFor="metadata_access">Metadaten-Zugriff (Objekte und Felder)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="data_access"
                checked={formData.data_access}
                onCheckedChange={(checked) => handleSwitchChange('data_access', checked)}
              />
              <Label htmlFor="data_access">Datenzugriff (Datensätze)</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <ThemedButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Einladung erstellen...
                </>
              ) : (
                'Einladung erstellen'
              )}
            </ThemedButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
