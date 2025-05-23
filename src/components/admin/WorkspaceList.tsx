
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ThemedButton } from '@/components/ui/themed-button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  primary_color: string;
  welcome_message: string | null;
}

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching workspaces:', error);
        setError('Fehler beim Laden der Workspaces: ' + error.message);
        toast.error('Fehler beim Laden der Workspaces');
        throw error;
      }
      
      setWorkspaces(data || []);
    } catch (error: any) {
      console.error('Error fetching workspaces:', error);
      setError('Fehler beim Laden der Workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceCreated = () => {
    fetchWorkspaces();
    setCreateDialogOpen(false);
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Workspaces</CardTitle>
        <div className="flex space-x-2">
          <ThemedButton size="sm" variant="outline" onClick={fetchWorkspaces} title="Aktualisieren">
            <RefreshCw className="h-4 w-4" />
          </ThemedButton>
          <ThemedButton size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Workspace erstellen
          </ThemedButton>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      
        {workspaces.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.map((workspace) => (
                <TableRow key={workspace.id}>
                  <TableCell className="font-medium">{workspace.name}</TableCell>
                  <TableCell>{workspace.description}</TableCell>
                  <TableCell>{new Date(workspace.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workspace.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {workspace.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ThemedButton asChild variant="outline" size="sm">
                      <Link to={`/admin/workspace/${workspace.id}`}>Details</Link>
                    </ThemedButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">Keine Workspaces gefunden</p>
            <ThemedButton onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Workspace erstellen
            </ThemedButton>
          </div>
        )}
      </CardContent>
      
      <CreateWorkspaceDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
      />
    </Card>
  );
}
