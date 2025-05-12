
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This function runs as a scheduled job, so we use the service role key
serve(async (req: Request) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get current date for file naming
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `${dateStr}.csv`;
    const bucketName = "scraper-feedback";
    const filePath = `${fileName}`;

    // Create bucket if it doesn't exist
    const { error: bucketError } = await supabaseAdmin
      .storage
      .createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ['text/csv'],
      });

    if (bucketError && !bucketError.message.includes("already exists")) {
      throw bucketError;
    }

    // Export data from the last day
    const { data: feedbackData, error: queryError } = await supabaseAdmin
      .from('scraper_feedback')
      .select('*')
      .gte('created_at', new Date(now.getTime() - 86400000).toISOString()); // Last 24 hours

    if (queryError) throw queryError;

    if (!feedbackData || feedbackData.length === 0) {
      console.log("No feedback data to export for the last day.");
      return new Response(JSON.stringify({ message: "No data to export" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert data to CSV
    const headers = Object.keys(feedbackData[0]);
    let csv = headers.join(',') + '\n';

    feedbackData.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        // Handle values with commas, quotes, etc.
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') {
          if (val.includes('"') || val.includes(',') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
        }
        return val;
      });
      csv += values.join(',') + '\n';
    });

    // Upload CSV to Storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .upload(filePath, csv, {
        contentType: 'text/csv',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Delete data older than 24 months to comply with data retention policies
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - 24);
    
    const { error: deleteError } = await supabaseAdmin
      .from('scraper_feedback')
      .delete()
      .lt('created_at', retentionDate.toISOString());

    if (deleteError) {
      console.error("Error deleting old feedback:", deleteError);
      // Continue execution, don't fail the entire job
    }

    console.log(`Successfully exported ${feedbackData.length} feedback records to ${bucketName}/${filePath}`);
    console.log("Deleted feedback records older than 24 months.");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Exported ${feedbackData.length} records to ${bucketName}/${filePath}` 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in export_feedback:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
