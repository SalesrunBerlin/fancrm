
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to stream OpenAI responses
async function streamOpenAIResponse(
  response: Response,
  user_id: string,
  supabase: any
) {
  const reader = response.body?.getReader()
  let promptTokens = 0
  let completionTokens = 0
  
  if (!reader) {
    throw new Error('Response body is null')
  }

  // Process the stream chunks
  const processStream = async () => {
    let decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }
      
      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      // Find complete SSE messages
      let messages = buffer.split('\n\n')
      buffer = messages.pop() || ''
      
      for (const message of messages) {
        if (message.trim() === '') continue
        if (message.includes('data: [DONE]')) continue
        
        if (message.includes('data: ')) {
          try {
            const data = JSON.parse(message.replace('data: ', ''))
            if (data.usage) {
              promptTokens = data.usage.prompt_tokens || 0
              completionTokens = data.usage.completion_tokens || 0
            }
          } catch (e) {
            // Ignore parsing errors in stream
          }
        }
      }
    }
    
    // Update token usage if we have data
    if (promptTokens > 0 || completionTokens > 0) {
      // Upsert into usage table
      const { error } = await supabase.rpc('update_openai_usage', {
        p_profile_id: user_id,
        p_prompt_tokens: promptTokens,
        p_completion_tokens: completionTokens
      })
      
      if (error) {
        console.error('Error updating token usage:', error)
      }
    }
  }

  // Start processing the stream in the background
  processStream().catch(err => console.error('Stream processing error:', err))
  
  return response
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

    // Retrieve the encrypted API key
    const { data: keyData, error: keyError } = await supabase
      .from('openai_key_profile')
      .select('api_key_enc')
      .eq('profile_id', user.id)
      .single()

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'API key not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Decrypt the API key
    const { data: decryptData, error: decryptError } = await supabase.rpc('decrypt_api_key', {
      p_encrypted_key: keyData.api_key_enc,
      p_secret: encryptionKey
    })

    if (decryptError || !decryptData) {
      console.error('Decryption error:', decryptError)
      return new Response(JSON.stringify({ error: 'Failed to decrypt API key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for daily token usage and enforce limits
    const { data: usageData, error: usageError } = await supabase
      .from('openai_usage_profile')
      .select('prompt_tokens, completion_tokens')
      .eq('profile_id', user.id)
      .eq('day', new Date().toISOString().split('T')[0])
      .single()

    const totalTokens = usageData ? 
      (usageData.prompt_tokens || 0) + (usageData.completion_tokens || 0) : 0

    if (totalTokens > 100000) {
      return new Response(JSON.stringify({ error: 'Daily token limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse the request body
    const requestBody = await req.json()
    const { model, messages, temperature = 0.7, dataScope = [] } = requestBody

    if (!model || !messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build context from related data
    let contextSnippets: string[] = []
    const { data: relevantData, error: relevantError } = await supabase
      .from('object_embeddings')
      .select('content')
      .eq('profile_id', user.id)
      .in('object_type', dataScope.length > 0 ? dataScope : ['*'])
      .limit(5)

    if (!relevantError && relevantData) {
      contextSnippets = relevantData.map((item: any) => item.content)
    }

    // Build system message with context if available
    let systemMessage = messages.find((m: any) => m.role === 'system')
    
    if (systemMessage) {
      // Remove original system message
      messages = messages.filter((m: any) => m.role !== 'system')
    } else {
      systemMessage = { 
        role: 'system', 
        content: 'You are a helpful assistant.' 
      }
    }
    
    // Add context to system message if available
    if (contextSnippets.length > 0) {
      systemMessage.content = `${systemMessage.content}\n\nHere is some relevant context from the user's data:\n${contextSnippets.join('\n\n')}`
    }
    
    // Put system message at the beginning
    const enhancedMessages = [systemMessage, ...messages]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${decryptData.decrypted_key}`,
      },
      body: JSON.stringify({
        model,
        messages: enhancedMessages,
        temperature,
        stream: true,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({ error: 'Unknown error' }))
      return new Response(JSON.stringify({ error: error.error || 'OpenAI API error' }), {
        status: openaiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Stream the response directly to the client
    const transformedResponse = await streamOpenAIResponse(openaiResponse, user.id, supabase)
    
    // Create new response with CORS headers
    const newResponse = new Response(transformedResponse.body, {
      status: transformedResponse.status,
      statusText: transformedResponse.statusText,
      headers: {
        ...Object.fromEntries(transformedResponse.headers.entries()),
        ...corsHeaders
      }
    })

    return newResponse
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
