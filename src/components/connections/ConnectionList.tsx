
import React from 'react';
import { useConnections, Connection } from '@/hooks/useConnections';
import { ConnectionCard } from './ConnectionCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ConnectionListProps {
  onEditConnection?: (connection: Connection) => void;
}

export function ConnectionList({ onEditConnection }: ConnectionListProps) {
  const { connections, isLoading, error, fetchConnections } = useConnections();

  const handleRefresh = () => {
    fetchConnections();
  };

  if (error) {
    return (
      <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h3 className="text-lg font-semibold">Failed to load connections</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
