
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceSettings } from "@/components/admin/WorkspaceSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminWorkspacePage() {
  const { isSuperAdmin } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setWorkspaces(data || []);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkspaces();
  }, []);
  
  // Redirect if not admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Default to first workspace if available
  const primaryWorkspace = workspaces.length > 0 ? workspaces[0] : null;
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Workspace-Einstellungen" 
        description="Bearbeiten Sie die Einstellungen für Ihren Workspace und Konfigurieren Sie die Anmeldeoption für Ihre Benutzer"
      />
      
      {primaryWorkspace ? (
        <WorkspaceSettings workspaceId={primaryWorkspace.id} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <p>Kein Workspace gefunden. Bitte erstellen Sie einen neuen Workspace.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
