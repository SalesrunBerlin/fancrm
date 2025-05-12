
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useConnections } from './useConnections';

export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface UseOpenAIOptions {
  defaultSystemMessage?: string;
}

export function useOpenAI(options: UseOpenAIOptions = {}) {
  const { user } = useAuth();
  const { hasConnection, getConnectionByType, makeRequest } = useConnections({ autoFetch: true });
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<OpenAIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [usage, setUsage] = useState<{ prompt_tokens: number; completion_tokens: number } | null>(null);

  // Check if the user has an OpenAI connection
  const hasApiKey = hasConnection('openai');

  // Store a new OpenAI API key (for backward compatibility)
  const storeApiKey = async (apiKey: string) => {
    if (!user) {
      toast.error('You must be logged in to store an API key');
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.functions.invoke('store_connection', {
        body: { 
          service_type: 'openai', 
          display_name: 'OpenAI', 
          api_key: apiKey
        }
      });

      if (error) throw error;
      
      toast.success('API key stored successfully');
      return true;
    } catch (error) {
      console.error('Failed to store API key:', error);
      toast.error('Failed to store API key');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete the stored API key (for backward compatibility)
  const deleteApiKey = async () => {
    if (!user) {
      toast.error('You must be logged in to delete your API key');
      return false;
    }

    const connection = getConnectionByType('openai');
    if (!connection) {
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.functions.invoke('delete_connection', {
        body: { connection_id: connection.id }
      });

      if (error) throw error;
      
      toast.success('API key removed successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message to OpenAI with streaming response
  const sendMessage = async (
    userMessage: string, 
    dataScope: string[] = [], 
    model: string = 'gpt-4o'
  ) => {
    if (!user) {
      toast.error('You must be logged in to send messages');
      return;
    }

    if (!hasApiKey) {
      toast.error('OpenAI API key not configured');
      return;
    }

    const connection = getConnectionByType('openai');
    if (!connection) {
      toast.error('OpenAI connection not found');
      return;
    }

    try {
      setIsLoading(true);
      setIsStreaming(true);

      // Add system message if not present
      let newMessages = [...messages];
      if (!newMessages.some(m => m.role === 'system') && options.defaultSystemMessage) {
        newMessages = [
          { role: 'system', content: options.defaultSystemMessage },
          ...newMessages
        ];
      }

      // Add user message
      newMessages = [
        ...newMessages,
        { role: 'user', content: userMessage }
      ];
      setMessages(newMessages);

      // Set up request data for the OpenAI API
      const requestData = {
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          model,
          messages: newMessages,
          temperature: 0.7,
          stream: true
        },
        stream: true
      };

      // Send the request through our proxy
      const response = await makeRequest(connection.id, requestData);

      if (!response || !response.data) {
        throw new Error('No data in response');
      }

      // Process the stream
      const reader = response.data.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantMessage = '';

      // Create temporary message for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices && data.choices[0]?.delta?.content) {
                assistantMessage += data.choices[0].delta.content;
                
                // Update the last message with the accumulated content
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }

              // Track token usage
              if (data.usage) {
                setUsage({
                  prompt_tokens: data.usage.prompt_tokens,
                  completion_tokens: data.usage.completion_tokens
                });
              }
            } catch (e) {
              // Ignore parsing errors in stream
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Get usage statistics
  const getUsageStats = async () => {
    if (!user) {
      return null;
    }

    try {
      // Since we don't have an openai_usage_profile table yet, we'll just return a placeholder
      // This should be implemented properly later when the table exists
      return null;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return null;
    }
  };

  // Reset conversation history
  const resetConversation = () => {
    // Preserve the system message if it exists
    const systemMessage = messages.find(m => m.role === 'system');
    setMessages(systemMessage ? [systemMessage] : []);
  };

  return {
    hasApiKey,
    isLoading,
    messages,
    isStreaming,
    usage,
    storeApiKey,
    deleteApiKey,
    sendMessage,
    getUsageStats,
    resetConversation
  };
}
