
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ConnectionType = 'openai' | 'anthropic' | 'google' | 'azure' | 'perplexity';

export interface Connection {
  id: string;
  service_type: ConnectionType;
  display_name: string;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConnectionTypeInfo {
  service_type: string;
  has_connection: boolean;
  display_name: string;
  connection_id: string | null;
  is_active: boolean;
}

interface UseConnectionsOptions {
  autoFetch?: boolean;
}

export function useConnections(options: UseConnectionsOptions = {}) {
  const { autoFetch = true } = options;
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionTypes, setConnectionTypes] = useState<ConnectionTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all connections for the user
  const fetchConnections = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .order('service_type', { ascending: true });

      if (error) {
        console.error('Failed to fetch connections:', error);
        throw error;
      }
      
      setConnections(data as Connection[] || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available connection types and user's configured connections
  const fetchConnectionTypes = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_user_connection_types');

      if (error) {
        console.error('Failed to fetch connection types:', error);
        throw error;
      }
      
      setConnectionTypes(data as ConnectionTypeInfo[] || []);
    } catch (error) {
      console.error('Failed to fetch connection types:', error);
      toast.error('Failed to fetch connection types');
    } finally {
      setIsLoading(false);
    }
  };

  // Store a new connection
  const storeConnection = async (
    serviceType: ConnectionType, 
    displayName: string, 
    apiKey: string, 
    config: Record<string, any> = {}
  ) => {
    if (!user) {
      toast.error('You must be logged in to store a connection');
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.functions.invoke('store_connection', {
        body: { 
          service_type: serviceType, 
          display_name: displayName, 
          api_key: apiKey,
          config 
        }
      });

      if (error) throw error;
      
      toast.success('Connection stored successfully');
      
      // Refresh connections
      await fetchConnections();
      await fetchConnectionTypes();
      
      return true;
    } catch (error: any) {
      console.error('Failed to store connection:', error);
      toast.error('Failed to store connection');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a connection
  const deleteConnection = async (connectionId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a connection');
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.functions.invoke('delete_connection', {
        body: { connection_id: connectionId }
      });

      if (error) throw error;
      
      toast.success('Connection removed successfully');
      
      // Refresh connections
      await fetchConnections();
      await fetchConnectionTypes();
      
      return true;
    } catch (error: any) {
      console.error('Failed to delete connection:', error);
      toast.error('Failed to delete connection');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Enable/disable a connection
  const toggleConnectionStatus = async (connectionId: string, isActive: boolean) => {
    if (!user) {
      toast.error('You must be logged in to update a connection');
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('user_connections')
        .update({ is_active: isActive })
        .eq('id', connectionId);

      if (error) throw error;
      
      toast.success(`Connection ${isActive ? 'enabled' : 'disabled'} successfully`);
      
      // Refresh connections
      await fetchConnections();
      await fetchConnectionTypes();
      
      return true;
    } catch (error: any) {
      console.error('Failed to update connection status:', error);
      toast.error('Failed to update connection status');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Make API request using a connection
  const makeRequest = async (
    connectionId: string, 
    requestData: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      stream?: boolean;
    }
  ) => {
    if (!user) {
      toast.error('You must be logged in to use a connection');
      return null;
    }

    try {
      // For streaming responses, handle them properly
      const options: any = {
        body: {
          connection_id: connectionId,
          request_data: requestData
        }
      };
      
      // Set responseType option for streaming if needed
      if (requestData.stream) {
        options.responseType = 'stream';
      }
      
      const response = await supabase.functions.invoke('proxy_connection', options);

      if (response.error) throw response.error;
      
      return response;
    } catch (error: any) {
      console.error('API request failed:', error);
      toast.error('API request failed');
      return null;
    }
  };

  // Get connection by service type
  const getConnectionByType = (serviceType: ConnectionType): Connection | undefined => {
    return connections.find(conn => 
      conn.service_type === serviceType && conn.is_active
    );
  };

  // Check if specific connection type is available
  const hasConnection = (serviceType: ConnectionType): boolean => {
    return connections.some(conn => 
      conn.service_type === serviceType && conn.is_active
    );
  };

  // Auto-fetch connections when component mounts
  useEffect(() => {
    if (autoFetch && user) {
      fetchConnections();
      fetchConnectionTypes();
    }
  }, [user, autoFetch]);

  return {
    connections,
    connectionTypes,
    isLoading,
    fetchConnections,
    fetchConnectionTypes,
    storeConnection,
    deleteConnection,
    toggleConnectionStatus,
    makeRequest,
    getConnectionByType,
    hasConnection
  };
}
