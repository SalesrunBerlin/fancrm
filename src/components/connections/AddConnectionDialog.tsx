
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionType, Connection, useConnections } from "@/hooks/useConnections";
import { ConnectionManager } from "./ConnectionManager";
import { Loader2 } from "lucide-react";

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingConnection?: Connection | null;
}

export function AddConnectionDialog({
  open,
  onOpenChange,
  editingConnection = null
}: AddConnectionDialogProps) {
  const [selectedService, setSelectedService] = useState<ConnectionType>("openai");
  const { connectionTypes, isLoading } = useConnections();
  
  // Update the selected service when editing an existing connection
  useEffect(() => {
    if (editingConnection) {
      setSelectedService(editingConnection.service_type);
    }
  }, [editingConnection]);
  
  // Filter out types that already have connections unless we're editing that connection
  const availableTypes = connectionTypes.filter(ct => 
    !ct.has_connection || (editingConnection && ct.service_type === editingConnection.service_type)
  );
  
  // Define configuration options for different services
  const getConfigFields = (type: ConnectionType) => {
    switch (type) {
      case 'openai':
        return [];
      case 'anthropic':
        return [];
      case 'google':
        return [
          {
            name: 'project_id',
            label: 'Project ID',
            type: 'text' as const,
            placeholder: 'Your Google Cloud Project ID',
            required: true
          }
        ];
      case 'azure':
        return [
          {
            name: 'endpoint',
            label: 'Endpoint',
            type: 'text' as const,
            placeholder: 'https://your-resource.openai.azure.com/',
            required: true
          },
          {
            name: 'deployment_id',
            label: 'Deployment ID',
            type: 'text' as const,
            placeholder: 'Your deployment name',
            required: true
          }
        ];
      default:
        return [];
    }
  };

  const getServiceTitle = (type: string) => {
    switch (type) {
      case 'openai':
        return 'OpenAI API';
      case 'anthropic':
        return 'Anthropic Claude API';
      case 'google':
        return 'Google AI API';
      case 'azure':
        return 'Azure OpenAI API';
      case 'perplexity':
        return 'Perplexity API';
      default:
        return `${type.charAt(0).toUpperCase() + type.slice(1)} API`;
    }
  };

  const getServiceDescription = (type: string) => {
    switch (type) {
      case 'openai':
        return 'Connect to OpenAI API for services like ChatGPT and DALL-E';
      case 'anthropic':
        return 'Connect to Anthropic\'s Claude API for advanced AI assistants';
      case 'google':
        return 'Connect to Google\'s AI services like Gemini';
      case 'azure':
        return 'Connect to Microsoft Azure OpenAI services';
      case 'perplexity':
        return 'Connect to Perplexity API for research and information retrieval';
      default:
        return 'Configure your API connection';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingConnection ? 'Edit Connection' : 'Add New Connection'}</DialogTitle>
          <DialogDescription>
            {editingConnection 
              ? `Edit your ${editingConnection.service_type} connection settings`
              : 'Connect your accounts to AI services and other APIs'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : editingConnection ? (
          // When editing, just show the single connection manager
          <ConnectionManager
            serviceType={editingConnection.service_type}
            title={getServiceTitle(editingConnection.service_type)}
            description={getServiceDescription(editingConnection.service_type)}
            defaultDisplayName={editingConnection.display_name}
            configFields={getConfigFields(editingConnection.service_type)}
          />
        ) : availableTypes.length > 0 ? (
          <Tabs 
            defaultValue={availableTypes[0]?.service_type || "openai"} 
            onValueChange={(value) => setSelectedService(value as ConnectionType)}
          >
            <TabsList className="grid grid-cols-3 lg:grid-cols-5">
              {availableTypes.map((type) => (
                <TabsTrigger key={type.service_type} value={type.service_type}>
                  {type.service_type.charAt(0).toUpperCase() + type.service_type.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {availableTypes.map((type) => (
              <TabsContent key={type.service_type} value={type.service_type}>
                <ConnectionManager
                  serviceType={type.service_type as ConnectionType}
                  title={getServiceTitle(type.service_type)}
                  description={getServiceDescription(type.service_type)}
                  defaultDisplayName={getServiceTitle(type.service_type)}
                  configFields={getConfigFields(type.service_type as ConnectionType)}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p>You've already configured all available connections.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
