
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

    // Parse the request body
    const { connection_id, request_data } = await req.json();
    
    if (!connection_id || !request_data || !request_data.url) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Decrypt the connection data
    const { data: decryptedData, error: decryptError } = await supabase
      .rpc('decrypt_connection', {
        p_connection_id: connection_id,
        p_secret: encryptionKey
      })
      .single()

    if (decryptError || !decryptedData) {
      console.error('Decryption error:', decryptError)
      return new Response(JSON.stringify({ error: 'Failed to decrypt connection' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = decryptedData.decrypted_key
    const serviceType = decryptedData.service_type
    const { url, method, headers = {}, body } = request_data

    // Add appropriate authorization based on service type
    const authHeaders: Record<string, string> = {}
    
    switch(serviceType) {
      case 'openai':
        authHeaders['Authorization'] = `Bearer ${apiKey}`
        break
      case 'anthropic':
        authHeaders['x-api-key'] = apiKey
        break
      case 'perplexity':
        authHeaders['Authorization'] = `Bearer ${apiKey}`
        break
      case 'google':
        authHeaders['Authorization'] = `Bearer ${apiKey}`
        break
      case 'azure':
        authHeaders['api-key'] = apiKey
        break
      default:
        authHeaders['Authorization'] = `Bearer ${apiKey}`
    }

    // Make the request to the external API
    const externalResponse = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    // Handle streaming responses
    const contentType = externalResponse.headers.get('Content-Type') || ''
    const isStream = contentType.includes('text/event-stream') || 
                    request_data.stream === true || 
                    (body && body.stream === true)

    if (isStream) {
      // For streaming responses, set up appropriate headers and stream
      return new Response(externalResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        status: externalResponse.status,
      })
    } else {
      // For regular responses, just return the data
      const data = await externalResponse.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: externalResponse.status
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
