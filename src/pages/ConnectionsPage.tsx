
import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { ConnectionList } from "@/components/connections/ConnectionList";
import { AddConnectionDialog } from "@/components/connections/AddConnectionDialog";
import { Connection, useConnections } from "@/hooks/useConnections";
import { Card, CardContent } from '@/components/ui/card';

export default function ConnectionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const { isLoading, error } = useConnections();
  
  const handleAddConnection = () => {
    setEditingConnection(null);
    setDialogOpen(true);
  };
  
  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    setDialogOpen(true);
  };

  if (isLoading && !dialogOpen) {
    return (
      <div className="container py-6 space-y-6">
        <PageHeader
          title="Connections"
          description="Manage your connections to external services"
        />
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error && !dialogOpen) {
    return (
      <div className="container py-6 space-y-6">
        <PageHeader
          title="Connections"
          description="Manage your connections to external services"
        />
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-semibold">Failed to load connections</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Connections"
          description="Manage your connections to external services"
        />
        
        <Button onClick={handleAddConnection} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>
      
      <ConnectionList onEditConnection={handleEditConnection} />
      
      <AddConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingConnection={editingConnection}
      />
    </div>
  );
}
