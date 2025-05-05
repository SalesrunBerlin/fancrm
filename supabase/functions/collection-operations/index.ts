
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CollectionOperationType = 'getMemberCollections' | 'addRecordsToCollection' | 'addFieldsToCollection';

interface CollectionOperation {
  type: CollectionOperationType;
  collectionId?: string;
  recordIds?: string[];
  objectTypeId?: string;
  fieldApiNames?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Create Supabase client with auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    const requestData: CollectionOperation = await req.json();
    
    // Handle different operation types
    switch(requestData.type) {
      case 'getMemberCollections': {
        // Get collections where the user is a member
        const { data: memberCollectionsData, error: memberError } = await supabaseClient
          .from('collection_members')
          .select('collection_id')
          .eq('user_id', user.id);
        
        if (memberError) {
          throw new Error(`Error fetching member collections: ${memberError.message}`);
        }
        
        // Get the full collection data
        const collectionIds = memberCollectionsData.map(m => m.collection_id);
        
        if (collectionIds.length === 0) {
          return new Response(
            JSON.stringify({ data: [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: collections, error: collectionsError } = await supabaseClient
          .from('sharing_collections')
          .select('*')
          .in('id', collectionIds);
        
        if (collectionsError) {
          throw new Error(`Error fetching collections: ${collectionsError.message}`);
        }
        
        // Enhance collections with member and record counts
        const collectionsWithCounts = await Promise.all(collections.map(async (collection) => {
          try {
            // Get member count
            const { count: memberCount, error: countError } = await supabaseClient
              .from('collection_members')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);
              
            // Get record count
            const { count: recordCount, error: recordError } = await supabaseClient
              .from('collection_records')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);
            
            return {
              ...collection,
              memberCount: memberCount || 0,
              recordCount: recordCount || 0
            };
          } catch (error) {
            console.error(`Error processing collection ${collection.id}:`, error);
            return {
              ...collection,
              memberCount: 0,
              recordCount: 0
            };
          }
        }));
        
        return new Response(
          JSON.stringify({ data: collectionsWithCounts }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'addRecordsToCollection': {
        if (!requestData.collectionId || !requestData.recordIds || requestData.recordIds.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // First, verify user is the collection owner
        const { data: collectionData, error: collectionError } = await supabaseClient
          .from('sharing_collections')
          .select('*')
          .eq('id', requestData.collectionId)
          .eq('owner_id', user.id)
          .single();
        
        if (collectionError || !collectionData) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to modify this collection' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Insert records into collection
        const recordsToInsert = requestData.recordIds.map(recordId => ({
          collection_id: requestData.collectionId,
          record_id: recordId
        }));
        
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('collection_records')
          .upsert(recordsToInsert)
          .select();
        
        if (insertError) {
          throw new Error(`Error adding records to collection: ${insertError.message}`);
        }
        
        return new Response(
          JSON.stringify({ data: insertedData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'addFieldsToCollection': {
        if (!requestData.collectionId || !requestData.objectTypeId || !requestData.fieldApiNames || requestData.fieldApiNames.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Verify user is the collection owner
        const { data: collectionData, error: collectionError } = await supabaseClient
          .from('sharing_collections')
          .select('*')
          .eq('id', requestData.collectionId)
          .eq('owner_id', user.id)
          .single();
        
        if (collectionError || !collectionData) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to modify this collection' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Add fields to collection
        const fieldsToInsert = requestData.fieldApiNames.map(fieldApiName => ({
          collection_id: requestData.collectionId,
          object_type_id: requestData.objectTypeId,
          field_api_name: fieldApiName
        }));
        
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('collection_fields')
          .upsert(fieldsToInsert)
          .select();
        
        if (insertError) {
          throw new Error(`Error adding fields to collection: ${insertError.message}`);
        }
        
        return new Response(
          JSON.stringify({ data: insertedData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in collection-operations function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
