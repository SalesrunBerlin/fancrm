
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get encryption key from environment variables
    const encryptionKey = Deno.env.get('AI_KEY_CRYPT')
    if (!encryptionKey) {
      return new Response(JSON.stringify({ error: 'Encryption key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the request body
    const requestBody = await req.json()
    const { model, messages, temperature = 0.7, dataScope = [] } = requestBody
    
    if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for token usage limits
    const { data: usageData } = await supabase
      .from('openai_usage_profile')
      .select('prompt_tokens, completion_tokens')
      .eq('profile_id', user.id)
      .eq('day', new Date().toISOString().split('T')[0])
      .maybeSingle()
    
    const currentPromptTokens = usageData?.prompt_tokens || 0
    const currentCompletionTokens = usageData?.completion_tokens || 0
    const totalTokens = currentPromptTokens + currentCompletionTokens
    
    if (totalTokens > 100000) {
      return new Response(JSON.stringify({ 
        error: 'Daily token usage limit reached (100,000 tokens)',
        usage: { prompt_tokens: currentPromptTokens, completion_tokens: currentCompletionTokens }
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's encrypted API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('openai_key_profile')
      .select('api_key_enc')
      .eq('profile_id', user.id)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: 'API key not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Decrypt the API key
    const { data: decryptResult, error: decryptError } = await supabase
      .rpc('decrypt_api_key', {
        p_encrypted_key: apiKeyData.api_key_enc,
        p_secret: encryptionKey
      })
      .single()

    if (decryptError || !decryptResult) {
      return new Response(JSON.stringify({ error: 'Failed to decrypt API key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = decryptResult.decrypted_key

    // Get the latest user message for context retrieval
    const userMessage = messages.slice().reverse().find(msg => msg.role === 'user')?.content || ''

    // Array to store relevant context snippets
    let relevantContext: string[] = []

    // Get relevant context from vector embeddings
    if (userMessage && dataScope && dataScope.length > 0) {
      try {
        // First get an embedding for the user's query from OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: userMessage
          })
        })

        const embeddingData = await embeddingResponse.json()
        
        if (embeddingData.error) {
          console.error('Error getting embeddings:', embeddingData.error)
        } else {
          const queryEmbedding = embeddingData.data[0].embedding

          // Query for relevant contexts based on similarity search
          // Use cosine similarity via a SQL function for now (basic RAG approach)
          // When pgvector extension is available, switch to vector operations
          // For now, we'll simulate by getting recent object content
          const { data: contextData } = await supabase
            .from('object_embeddings')
            .select('content')
            .eq('profile_id', user.id)
            .in('object_type', dataScope)
            .order('created_at', { ascending: false })
            .limit(5)

          if (contextData && contextData.length > 0) {
            relevantContext = contextData.map(item => item.content)
          }
        }
      } catch (error) {
        console.error('Error retrieving context:', error)
        // Continue without context if there's an error
      }
    }

    // Add relevant context to system message or create new system message
    let messagesWithContext = [...messages]
    
    if (relevantContext.length > 0) {
      const contextText = relevantContext.join('\n\n')
      
      const systemMessageIndex = messagesWithContext.findIndex(m => m.role === 'system')
      
      if (systemMessageIndex >= 0) {
        // Append context to existing system message
        messagesWithContext[systemMessageIndex] = {
          ...messagesWithContext[systemMessageIndex],
          content: `${messagesWithContext[systemMessageIndex].content}\n\nHere is some relevant context from the user's CRM data:\n\n${contextText}`
        }
      } else {
        // Create new system message with context
        messagesWithContext.unshift({
          role: 'system',
          content: `You are a helpful assistant. Here is some relevant context from the user's CRM data:\n\n${contextText}`
        })
      }
    }

    // Make request to OpenAI with streaming
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model,
        messages: messagesWithContext,
        temperature,
        stream: true
      })
    })

    // If the OpenAI response failed, return the error
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      return new Response(JSON.stringify({ error: errorData.error }), {
        status: openaiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create a new TransformStream for processing the incoming stream
    const transformStream = new TransformStream({
      async start(controller) {
        // Initialize variables to track token usage
        let promptTokens = 0
        let completionTokens = 0
        let lastChunk = ''

        function processChunk(chunk: string) {
          // If this is the first chunk, it includes a 'usage' field with prompt tokens
          if (chunk.includes('"prompt_tokens":')) {
            try {
              const usageMatch = chunk.match(/"usage":\s*{"prompt_tokens":\s*(\d+)/)
              if (usageMatch && usageMatch[1]) {
                promptTokens = parseInt(usageMatch[1])
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }

          // Update completion token count based on data chunks
          // This is approximate, actual count will be in the final [DONE] message
          if (chunk.includes('"content":')) {
            try {
              const contentMatches = chunk.match(/"content":\s*"([^"]+)"/)
              if (contentMatches && contentMatches[1]) {
                // Roughly estimate token count (1 token ≈ 4 chars)
                completionTokens += Math.ceil(contentMatches[1].length / 4)
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }

          // Check for final usage data in [DONE] message or completion
          if (chunk.includes('"finish_reason":')) {
            try {
              const usageMatch = chunk.match(/"usage":\s*{[^}]*"completion_tokens":\s*(\d+)/)
              if (usageMatch && usageMatch[1]) {
                completionTokens = parseInt(usageMatch[1])
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }

          // Forward the chunk to the client
          return chunk
        }

        // Process the incoming stream
        const reader = openaiResponse.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode the chunk and process it
          const chunk = decoder.decode(value)
          lastChunk = chunk
          
          // Process the chunk and enqueue it to the output stream
          controller.enqueue(new TextEncoder().encode(processChunk(chunk)))
        }

        // After the stream completes, update token usage in the database
        try {
          if (promptTokens > 0 || completionTokens > 0) {
            await supabase.rpc('update_openai_usage', {
              p_profile_id: user.id,
              p_prompt_tokens: promptTokens,
              p_completion_tokens: completionTokens
            })
          }
        } catch (e) {
          console.error('Error updating usage stats:', e)
        }
      },

      transform(chunk, controller) {
        controller.enqueue(chunk)
      }
    })

    // Return the streaming response
    return new Response(openaiResponse.body!.pipeThrough(transformStream), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
