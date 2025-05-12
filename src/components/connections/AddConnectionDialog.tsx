
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionType, useConnections } from "@/hooks/useConnections";
import { ConnectionManager } from "./ConnectionManager";

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddConnectionDialog({
  open,
  onOpenChange
}: AddConnectionDialogProps) {
  const [selectedService, setSelectedService] = useState<ConnectionType>("openai");
  const { connectionTypes } = useConnections();
  
  // Filter out types that already have connections
  const availableTypes = connectionTypes.filter(ct => !ct.has_connection);
  
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

  const getServiceTitle = (type: ConnectionType) => {
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

  const getServiceDescription = (type: ConnectionType) => {
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
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>
            Connect your accounts to AI services and other APIs
          </DialogDescription>
        </DialogHeader>
        
        {availableTypes.length > 0 ? (
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
                  title={getServiceTitle(type.service_type as ConnectionType)}
                  description={getServiceDescription(type.service_type as ConnectionType)}
                  defaultDisplayName={getServiceTitle(type.service_type as ConnectionType)}
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
