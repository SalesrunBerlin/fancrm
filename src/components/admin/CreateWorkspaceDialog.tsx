
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ThemedButton } from '@/components/ui/themed-button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onWorkspaceCreated: () => void;
}

export function CreateWorkspaceDialog({ 
  open, 
  onClose, 
  onWorkspaceCreated 
}: CreateWorkspaceDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    welcome_message: 'Willkommen! Bitte geben Sie Ihre Zugangsdaten ein, um auf den Workspace zuzugreifen.',
    primary_color: '#3b82f6'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Nicht angemeldet", {
        description: 'Sie müssen angemeldet sein, um einen Workspace zu erstellen.'
      });
      return;
    }

    if (!formData.name.trim()) {
      setErrorMessage("Workspace-Name darf nicht leer sein");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase
        .from('workspaces')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            welcome_message: formData.welcome_message,
            primary_color: formData.primary_color,
            owner_id: user.id
          }
        ])
        .select();

      if (error) {
        console.error('Error creating workspace:', error);
        setErrorMessage(error.message || 'Workspace konnte nicht erstellt werden');
        throw error;
      }
      
      toast.success(`Workspace "${formData.name}" wurde erfolgreich erstellt`);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        welcome_message: 'Willkommen! Bitte geben Sie Ihre Zugangsdaten ein, um auf den Workspace zuzugreifen.',
        primary_color: '#3b82f6'
      });
      
      onWorkspaceCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast.error("Fehler", {
        description: error.message || 'Workspace konnte nicht erstellt werden'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neuen Workspace erstellen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace-Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Mein Unternehmen"
              className={errorMessage ? "border-red-500" : ""}
            />
            {errorMessage && (
              <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optionale Beschreibung des Workspaces"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="welcome_message">Willkommensnachricht</Label>
            <Input
              id="welcome_message"
              name="welcome_message"
              value={formData.welcome_message}
              onChange={handleChange}
              placeholder="Nachricht auf der Login-Seite"
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
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <ThemedButton type="submit" disabled={isSubmitting} useUserColor={false}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstellen...
                </>
              ) : (
                'Workspace erstellen'
              )}
            </ThemedButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
