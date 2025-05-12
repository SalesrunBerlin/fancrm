
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plug, PlugZap, Trash2 } from "lucide-react";
import { useConnections, Connection } from "@/hooks/useConnections";

interface ConnectionCardProps {
  connection: Connection;
  onEdit?: () => void;
}

export function ConnectionCard({ connection, onEdit }: ConnectionCardProps) {
  const { deleteConnection, toggleConnectionStatus, isLoading } = useConnections();
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this connection?")) {
      deleteConnection(connection.id);
    }
  };
  
  const handleToggle = () => {
    toggleConnectionStatus(connection.id, !connection.is_active);
  };
  
  const getServiceIcon = () => {
    switch (connection.service_type) {
      case 'openai':
        return <PlugZap className="w-6 h-6 text-green-500" />;
      case 'anthropic':
        return <PlugZap className="w-6 h-6 text-purple-500" />;
      case 'google':
        return <PlugZap className="w-6 h-6 text-blue-500" />;
      case 'azure':
        return <PlugZap className="w-6 h-6 text-cyan-500" />;
      case 'perplexity':
        return <PlugZap className="w-6 h-6 text-red-500" />;
      default:
        return <Plug className="w-6 h-6" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {getServiceIcon()}
            <div>
              <CardTitle>{connection.display_name}</CardTitle>
              <CardDescription>
                {connection.service_type.toUpperCase()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`active-${connection.id}`}>
              {connection.is_active ? "Active" : "Inactive"}
            </Label>
            <Switch
              id={`active-${connection.id}`}
              checked={connection.is_active}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Last updated:</span>
            <span className="text-sm ml-2">
              {new Date(connection.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
