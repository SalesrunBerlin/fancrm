
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface UseOpenAIOptions {
  defaultSystemMessage?: string;
}

export function useOpenAI(options: UseOpenAIOptions = {}) {
  const { user } = useAuth();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<OpenAIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [usage, setUsage] = useState<{ prompt_tokens: number; completion_tokens: number } | null>(null);

  // Check if the user has an API key stored
  const checkApiKey = async () => {
    if (!user) {
      setHasApiKey(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('openai_key_profile')
        .select('profile_id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasApiKey(!!data);
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasApiKey(false);
    }
  };

  // Store a new OpenAI API key
  const storeApiKey = async (apiKey: string) => {
    if (!user) {
      toast.error('You must be logged in to store an API key');
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.functions.invoke('store_openai_key', {
        body: { api_key: apiKey }
      });

      if (error) throw error;
      
      setHasApiKey(true);
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

  // Delete the stored API key
  const deleteApiKey = async () => {
    if (!user) {
      toast.error('You must be logged in to delete your API key');
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.functions.invoke('delete_openai_key', {});

      if (error) throw error;
      
      setHasApiKey(false);
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

    try {
      setIsLoading(true);
      setIsStreaming(true);

      // Add system message if not present
      if (!messages.some(m => m.role === 'system') && options.defaultSystemMessage) {
        setMessages(prev => [
          { role: 'system', content: options.defaultSystemMessage! },
          ...prev
        ]);
      }

      // Add user message
      const newMessages = [
        ...messages,
        { role: 'user', content: userMessage }
      ];
      setMessages(newMessages);

      // Set up response stream
      const response = await supabase.functions.invoke('openai_proxy', {
        body: {
          model,
          messages: newMessages,
          temperature: 0.7,
          dataScope
        },
        responseType: 'stream'
      });

      if (!response.data) {
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
      const { data, error } = await supabase
        .from('openai_usage_profile')
        .select('prompt_tokens, completion_tokens')
        .eq('profile_id', user.id)
        .eq('day', new Date().toISOString().split('T')[0])
        .single();

      if (error) throw error;
      
      return data;
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

  // Check for API key on component mount or when user changes
  useEffect(() => {
    checkApiKey();
  }, [user]);

  return {
    hasApiKey,
    isLoading,
    messages,
    isStreaming,
    usage,
    checkApiKey,
    storeApiKey,
    deleteApiKey,
    sendMessage,
    getUsageStats,
    resetConversation
  };
}
