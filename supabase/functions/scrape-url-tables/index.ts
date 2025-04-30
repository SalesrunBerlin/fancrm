
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: "URL parameter is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Fetching tables from URL: ${url}`);
    
    // Fetch the HTML content from the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRMBot/1.0)'
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const html = await response.text();
    
    // Use cheerio to parse HTML and extract tables
    const $ = cheerio.load(html);
    const tables = [];
    
    $('table').each((index, tableElement) => {
      const tableData = {
        tableIndex: index,
        headers: [],
        rows: []
      };
      
      // Extract headers
      $(tableElement).find('tr:first-child th, tr:first-child td').each((colIndex, headerCell) => {
        const headerText = $(headerCell).text().trim();
        tableData.headers.push(headerText || `Column ${colIndex + 1}`);
      });
      
      // If no headers were found in th elements, try using the first row as headers
      if (tableData.headers.length === 0) {
        $(tableElement).find('tr:first-child td').each((colIndex, cell) => {
          const headerText = $(cell).text().trim();
          tableData.headers.push(headerText || `Column ${colIndex + 1}`);
        });
      }
      
      // Extract data rows (skip first row if it was used as headers)
      const dataRowsSelector = tableData.headers.some(h => h.startsWith('Column ')) ? 
                              'tr' : 'tr:not(:first-child)';
                              
      $(tableElement).find(dataRowsSelector).each((rowIndex, rowElement) => {
        // Limit to just enough rows for preview
        if (rowIndex < 10) {
          const rowData = [];
          $(rowElement).find('td').each((cellIndex, cellElement) => {
            rowData.push($(cellElement).text().trim());
          });
          
          // Only add rows that have data
          if (rowData.some(cell => cell !== '')) {
            tableData.rows.push(rowData);
          }
        }
      });

      // Only include tables that have data
      if (tableData.headers.length > 0 && tableData.rows.length > 0) {
        tables.push(tableData);
      }
    });

    console.log(`Found ${tables.length} tables on the page`);
    
    return new Response(
      JSON.stringify({ tables }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping URL:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process URL" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
