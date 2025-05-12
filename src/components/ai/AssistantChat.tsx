
import { useState, useRef, useEffect } from 'react';
import { useOpenAI, type OpenAIMessage } from '@/hooks/useOpenAI';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeyManager } from './ApiKeyManager';
import { Loader2, Send, RefreshCw, Bot, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface AssistantChatProps {
  systemPrompt?: string;
  title?: string;
  description?: string;
  dataScope?: string[];
}

export function AssistantChat({ 
  systemPrompt = "You are a helpful assistant",
  title = "AI Assistant",
  description = "Ask me anything about your data",
  dataScope = [] 
}: AssistantChatProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { 
    hasApiKey, 
    isLoading, 
    messages, 
    sendMessage, 
    resetConversation, 
    isStreaming, 
    usage 
  } = useOpenAI({
    defaultSystemMessage: systemPrompt
  });

  const handleSend = async () => {
    if (!input.trim()) return;
    const userInput = input;
    setInput('');
    await sendMessage(userInput, dataScope);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>Please sign in to use the AI assistant</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (hasApiKey === null) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Checking API key status</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (hasApiKey === false) {
    return <ApiKeyManager />;
  }

  // Filter out system messages for display
  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <Card className="w-full flex flex-col h-[600px]">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetConversation}
            disabled={isLoading || displayMessages.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        {usage && (
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">
              Prompt: {usage.prompt_tokens} tokens
            </Badge>
            <Badge variant="outline">
              Completion: {usage.completion_tokens} tokens
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent 
        className="flex-grow overflow-y-auto px-4"
        ref={chatContainerRef}
      >
        <div className="space-y-4">
          {displayMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Start a conversation by sending a message
            </div>
          ) : (
            displayMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[80%] rounded-lg p-3
                    ${msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs font-semibold">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))
          )}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <div className="flex w-full gap-2">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px]"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
