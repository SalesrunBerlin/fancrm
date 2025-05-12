import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ConnectionType, useConnections } from "@/hooks/useConnections";

interface ConnectionManagerProps {
  serviceType: ConnectionType;
  title?: string;
  description?: string;
  defaultDisplayName?: string;
  configFields?: {
    name: string;
    label: string;
    type: 'text' | 'password' | 'number';
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
  }[];
}

export function ConnectionManager({
  serviceType,
  title = "API Connection",
  description = "Add your API key to enable this connection",
  defaultDisplayName,
  configFields = [],
}: ConnectionManagerProps) {
  const { connectionTypes, storeConnection, deleteConnection, isLoading } = useConnections();
  
  const connectionInfo = connectionTypes.find(ct => ct.service_type === serviceType);
  const hasExistingConnection = connectionInfo?.has_connection ?? false;
  
  const [apiKey, setApiKey] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName || serviceType);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState("");

  const handleConfigChange = (name: string, value: string) => {
    setConfigValues(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteConnection = async () => {
    if (connectionInfo?.connection_id) {
      await deleteConnection(connectionInfo.connection_id);
    }
  };

  const handleSaveConnection = async () => {
    // Validation
    if (!apiKey) {
      setValidationError("API key is required");
      return;
    }

    if (!displayName) {
      setValidationError("Display name is required");
      return;
    }

    // Check for required config fields
    for (const field of configFields) {
      if (field.required && !configValues[field.name]) {
        setValidationError(`${field.label} is required`);
        return;
      }
    }

    setValidationError("");
    
    const success = await storeConnection(serviceType, displayName, apiKey, configValues);
    
    if (success) {
      setApiKey("");
      // Don't reset display name, it's better UX to keep it
      // Don't reset config values either unless you want to
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingConnection ? (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>API key is configured</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My API Connection"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${serviceType.toUpperCase()} API key`}
              />
            </div>
            
            {configFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type}
                  value={configValues[field.name] || field.defaultValue || ""}
                  onChange={(e) => handleConfigChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </div>
            ))}
            
            {validationError && (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {hasExistingConnection ? (
          <Button 
            variant="destructive" 
            disabled={isLoading}
            onClick={handleDeleteConnection}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove API Key
          </Button>
        ) : (
          <Button 
            onClick={handleSaveConnection}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save API Key
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
