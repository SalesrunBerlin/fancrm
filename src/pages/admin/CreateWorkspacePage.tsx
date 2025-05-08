
import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CreateWorkspacePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, favoriteColor } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast('Bitte geben Sie einen Namen für den Workspace an.');
      return;
    }

    if (!user) {
      toast('Sie müssen eingeloggt sein, um einen Workspace zu erstellen.');
      return;
    }

    try {
      setIsLoading(true);

      // Insert new workspace
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([
          { 
            name,
            description: description || null,
            owner_id: user.id
          }
        ])
        .select('id')
        .single();

      if (workspaceError) throw workspaceError;
      
      // Associate user with workspace
      const { error: userWorkspaceError } = await supabase
        .from('workspace_users')
        .insert([
          {
            workspace_id: workspaceData.id,
            user_id: user.id,
            is_admin: true,
            can_create_objects: true,
            can_modify_objects: true,
            can_manage_users: true,
            can_create_actions: true
          }
        ]);

      if (userWorkspaceError) throw userWorkspaceError;

      // Update user's default workspace
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ workspace_id: workspaceData.id })
        .eq('id', user.id);

      if (updateProfileError) {
        console.warn('Could not set workspace as default:', updateProfileError);
      }

      toast.success('Workspace wurde erfolgreich erstellt!');
      navigate('/admin/workspace');
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Fehler beim Erstellen des Workspace. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Neuen Workspace erstellen" 
        description="Erstellen Sie einen neuen Workspace für Ihre Organisation"
      />
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name des Workspace"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibung des Workspace (optional)"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/workspace')}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={isLoading || !name}
                useUserColor={true}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Workspace erstellen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
