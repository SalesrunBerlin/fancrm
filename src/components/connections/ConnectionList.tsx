
import React from 'react';
import { useConnections, Connection } from '@/hooks/useConnections';
import { ConnectionCard } from './ConnectionCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface ConnectionListProps {
  onEditConnection?: (connection: Connection) => void;
}

export function ConnectionList({ onEditConnection }: ConnectionListProps) {
  const { connections, isLoading, fetchConnections } = useConnections();

  const handleRefresh = () => {
    fetchConnections();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Connections</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <ConnectionCard 
              key={connection.id} 
              connection={connection}
              onEdit={() => onEditConnection && onEditConnection(connection)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>You don't have any connections set up yet.</p>
          <p>Add a new connection to get started.</p>
        </div>
      )}
    </div>
  );
}
