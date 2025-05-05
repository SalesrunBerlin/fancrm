
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CollectionOperationType = 'getMemberCollections' | 'addRecordsToCollection' | 'addFieldsToCollection' | 'addMemberToCollection' | 'removeMemberFromCollection' | 'updateMemberPermission';

interface CollectionOperation {
  type: CollectionOperationType;
  collectionId?: string;
  recordIds?: string[];
  objectTypeId?: string;
  fieldApiNames?: string[];
  userId?: string;
  memberId?: string;
  permissionLevel?: 'read' | 'edit';
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
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'No authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log('Auth header exists, creating Supabase client');
    
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
      console.error('User authentication error:', userError?.message || 'Auth session missing!');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('User authenticated successfully:', user.id);
    
    // Parse the request body
    let requestData: CollectionOperation;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Processing operation:', requestData.type, 'for user:', user.id);
    
    // Handle different operation types
    switch(requestData.type) {
      case 'getMemberCollections': {
        console.log('Fetching member collections for user:', user.id);
        // Get collections where the user is a member
        const { data: memberCollectionsData, error: memberError } = await supabaseClient
          .from('collection_members')
          .select('collection_id')
          .eq('user_id', user.id);
        
        if (memberError) {
          console.error('Error fetching member collections:', memberError);
          throw new Error(`Error fetching member collections: ${memberError.message}`);
        }
        
        // If user is not a member of any collections, return empty array
        if (!memberCollectionsData || memberCollectionsData.length === 0) {
          return new Response(
            JSON.stringify({ data: [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Get the full collection data
        const collectionIds = memberCollectionsData.map(m => m.collection_id);
        console.log('Found collection IDs:', collectionIds);
        
        const { data: collections, error: collectionsError } = await supabaseClient
          .from('sharing_collections')
          .select('*')
          .in('id', collectionIds);
        
        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
          throw new Error(`Error fetching collections: ${collectionsError.message}`);
        }
        
        // Enhance collections with member and record counts
        const collectionsWithCounts = await Promise.all((collections || []).map(async (collection) => {
          try {
            // Get member count
            const { count: memberCount, error: countError } = await supabaseClient
              .from('collection_members')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);
              
            if (countError) {
              console.error(`Error counting members for collection ${collection.id}:`, countError);
            }
            
            // Get record count
            const { count: recordCount, error: recordError } = await supabaseClient
              .from('collection_records')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);
            
            if (recordError) {
              console.error(`Error counting records for collection ${collection.id}:`, recordError);
            }
            
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
        
        console.log('Returning collections with counts, total:', collectionsWithCounts.length);
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
        
        console.log(`Adding ${requestData.recordIds.length} records to collection: ${requestData.collectionId}`);
        
        // First, verify user is the collection owner
        const { data: collectionData, error: collectionError } = await supabaseClient
          .from('sharing_collections')
          .select('*')
          .eq('id', requestData.collectionId)
          .eq('owner_id', user.id)
          .single();
        
        if (collectionError || !collectionData) {
          console.error('Not authorized to modify this collection:', collectionError);
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
          console.error('Error adding records to collection:', insertError);
          throw new Error(`Error adding records to collection: ${insertError.message}`);
        }
        
        console.log(`Successfully added ${insertedData?.length || 0} records to collection`);
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
        
        console.log(`Adding ${requestData.fieldApiNames.length} fields to collection: ${requestData.collectionId}`);
        
        // Verify user is the collection owner
        const { data: collectionData, error: collectionError } = await supabaseClient
          .from('sharing_collections')
          .select('*')
          .eq('id', requestData.collectionId)
          .eq('owner_id', user.id)
          .single();
        
        if (collectionError || !collectionData) {
          console.error('Not authorized to modify this collection:', collectionError);
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
          console.error('Error adding fields to collection:', insertError);
          throw new Error(`Error adding fields to collection: ${insertError.message}`);
        }
        
        console.log(`Successfully added ${insertedData?.length || 0} fields to collection`);
        return new Response(
          JSON.stringify({ data: insertedData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // New operations for member management
      case 'addMemberToCollection': {
        if (!requestData.collectionId || !requestData.userId || !requestData.permissionLevel) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`Adding member ${requestData.userId} to collection ${requestData.collectionId} with permission ${requestData.permissionLevel}`);
        
        try {
          // Explicitly use a service role query to bypass RLS for this operation
          // We've already verified the user is authenticated above
          const { data: isOwner } = await supabaseClient.rpc(
            'user_owns_collection_safe',
            { collection_uuid: requestData.collectionId, user_uuid: user.id }
          );
          
          if (!isOwner) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to add members to this collection' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const { data: memberData, error: memberError } = await supabaseClient
            .from('collection_members')
            .insert({
              collection_id: requestData.collectionId,
              user_id: requestData.userId,
              permission_level: requestData.permissionLevel
            })
            .select();
          
          if (memberError) {
            console.error('Error adding member to collection:', memberError);
            throw new Error(`Error adding member: ${memberError.message}`);
          }
          
          return new Response(
            JSON.stringify({ data: memberData }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error in addMemberToCollection:', error);
          return new Response(
            JSON.stringify({ error: error.message || 'Error adding member' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'removeMemberFromCollection': {
        if (!requestData.collectionId || !requestData.memberId) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`Removing member ${requestData.memberId} from collection ${requestData.collectionId}`);
        
        try {
          // Verify user is the collection owner
          const { data: isOwner } = await supabaseClient.rpc(
            'user_owns_collection_safe', 
            { collection_uuid: requestData.collectionId, user_uuid: user.id }
          );
          
          if (!isOwner) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to remove members from this collection' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const { data: memberData, error: memberError } = await supabaseClient
            .from('collection_members')
            .delete()
            .eq('id', requestData.memberId)
            .eq('collection_id', requestData.collectionId);
          
          if (memberError) {
            console.error('Error removing member from collection:', memberError);
            throw new Error(`Error removing member: ${memberError.message}`);
          }
          
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error in removeMemberFromCollection:', error);
          return new Response(
            JSON.stringify({ error: error.message || 'Error removing member' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'updateMemberPermission': {
        if (!requestData.collectionId || !requestData.memberId || !requestData.permissionLevel) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`Updating member ${requestData.memberId} permission to ${requestData.permissionLevel}`);
        
        try {
          // Verify user is the collection owner
          const { data: isOwner } = await supabaseClient.rpc(
            'user_owns_collection_safe',
            { collection_uuid: requestData.collectionId, user_uuid: user.id }
          );
          
          if (!isOwner) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to update members in this collection' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const { data: memberData, error: memberError } = await supabaseClient
            .from('collection_members')
            .update({ permission_level: requestData.permissionLevel })
            .eq('id', requestData.memberId)
            .eq('collection_id', requestData.collectionId);
          
          if (memberError) {
            console.error('Error updating member permission:', memberError);
            throw new Error(`Error updating member: ${memberError.message}`);
          }
          
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error in updateMemberPermission:', error);
          return new Response(
            JSON.stringify({ error: error.message || 'Error updating member permission' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
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
