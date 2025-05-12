
import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ConnectionList } from "@/components/connections/ConnectionList";
import { AddConnectionDialog } from "@/components/connections/AddConnectionDialog";
import { Connection } from "@/hooks/useConnections";

export default function ConnectionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  
  const handleAddConnection = () => {
    setEditingConnection(null);
    setDialogOpen(true);
  };
  
  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    setDialogOpen(true);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Connections"
          description="Manage your connections to external services"
        />
        
        <Button onClick={handleAddConnection}>
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>
      
      <ConnectionList onEditConnection={handleEditConnection} />
      
      <AddConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
