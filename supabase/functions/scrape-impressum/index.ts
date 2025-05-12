
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

// Types for our Impressum data
interface ImpressumData {
  company: string;
  address: string;
  phone: string | null;
  email: string | null;
  ceos: string[];
  source: string;
}

// Rate limiting implementation
const ipThrottler = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to parse Impressum content
export function parseImpressum(html: string): Partial<ImpressumData> {
  const $ = load(html);
  const text = $('body').text();
  const result: Partial<ImpressumData> = {};

  // Extract company name - look for common patterns
  const companyRegex = /(?:firma|unternehmen|company|angaben gemäß § 5 tmg|gemäß § 5 tmg|§ 5 tmg|name):?\s*([^\n\r]+?)(?:\n|gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\.)/i;
  const companyMatch = text.match(companyRegex);
  if (companyMatch && companyMatch[1]) {
    result.company = companyMatch[1].trim();
    // If company name doesn't include legal form, check for it
    if (!/gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\./i.test(result.company)) {
      const legalFormMatch = text.match(/(gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\.)/i);
      if (legalFormMatch) {
        result.company += ' ' + legalFormMatch[1];
      }
    }
  } else {
    // Fallback: look for h1/h2 that might contain company name
    const heading = $('h1, h2').first().text().trim();
    if (heading && !/(impressum|imprint|kontakt|contact)/i.test(heading)) {
      result.company = heading;
    } else {
      // Last resort: look for strong/b tags that might be company names
      const bold = $('strong, b').first().text().trim();
      if (bold && bold.length > 3 && bold.length < 50) {
        result.company = bold;
      }
    }
  }

  // Extract address - look for common patterns with postal codes
  const addressRegex = /(?:adresse|address|anschrift|sitz|straße|strasse)(?:[:\s]*)((?:(?:[^\n\r,]|,\s*(?!\d))+?)\s*,?\s*(?:\d{5}|\d{4})\s+[^\n\r,]+(?:,\s*[^\n\r]+)?)/i;
  const addressMatch = text.match(addressRegex);
  if (addressMatch && addressMatch[1]) {
    result.address = addressMatch[1].trim();
  } else {
    // Fallback: look for postal code pattern and extract surrounding text
    const postalMatch = text.match(/(\b\d{5}\b|\b\d{4}\b)\s+([A-Za-zäöüÄÖÜß\s\-]+)/);
    if (postalMatch) {
      const postalAndCity = postalMatch[0];
      // Look for street address before postal code
      const fullTextParts = text.split(postalAndCity);
      if (fullTextParts[0]) {
        const streetLines = fullTextParts[0].split('\n').slice(-3);
        for (const line of streetLines) {
          if (/straße|strasse|weg|allee|gasse|platz/i.test(line)) {
            result.address = (line.trim() + ' ' + postalAndCity).replace(/\s+/g, ' ');
            break;
          }
        }
      }
      
      if (!result.address) {
        result.address = postalAndCity.trim();
      }
    }
  }

  // Extract phone number
  const phoneRegex = /(?:(?:tel(?:efon)?|phone|fon)(?:[.:]\s*|\s*[:]\s*|\s*[\/]?\s*|\s+))([+\d\s\/\(\)-]{7,})/i;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch && phoneMatch[1]) {
    result.phone = phoneMatch[1].trim().replace(/\s+/g, ' ');
  }

  // Extract email address
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Extract CEOs/managing directors
  const ceosRegex = /(?:geschäftsführ(?:er|ung)|ceo|managing director|vertretungsberechtigte[r]?|vertreten durch|direktor)(?:[:\s]*)((?:[^\n\r]+?)(?:$|\n))/i;
  const ceosMatch = text.match(ceosRegex);
  if (ceosMatch && ceosMatch[1]) {
    // Split by common separators
    const ceosStr = ceosMatch[1].replace(/\([^)]*\)/g, '').trim();
    result.ceos = ceosStr
      .split(/(?:,|&|und|and|\||\n)/i)
      .map(name => name.trim())
      .filter(name => name.length > 2 && !/(?:ist|is|are|gmbh|ag|ug)/i.test(name));
  }

  return result;
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const now = Date.now();
    const clientThrottle = ipThrottler.get(clientIP) || { count: 0, resetTime: now + RATE_WINDOW };
    
    // Reset count if time window passed
    if (now > clientThrottle.resetTime) {
      clientThrottle.count = 0;
      clientThrottle.resetTime = now + RATE_WINDOW;
    }
    
    // Check if rate limit exceeded
    if (clientThrottle.count >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment rate limit counter
    clientThrottle.count++;
    ipThrottler.set(clientIP, clientThrottle);

    // Parse request body
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let baseUrl: URL;
    try {
      baseUrl = new URL(url);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching root URL: ${url}`);
    
    // Fetch the main page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImpressumBot/1.0; +https://example.com)'
      }
    });
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: HTTP ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Find Impressum/Imprint link
    const impressumLinks = $('a').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href')?.toLowerCase() || '';
      return text.includes('impressum') || text.includes('imprint') || 
             href.includes('impressum') || href.includes('imprint');
    });
    
    if (impressumLinks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Could not find Impressum/Imprint link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the first Impressum link href
    const impressumHref = $(impressumLinks[0]).attr('href');
    if (!impressumHref) {
      return new Response(
        JSON.stringify({ error: 'Found Impressum link but href is empty' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Resolve absolute URL
    const impressumUrl = new URL(impressumHref, baseUrl).toString();
    console.log(`Found Impressum URL: ${impressumUrl}`);
    
    // Fetch the Impressum page
    const impressumResponse = await fetch(impressumUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImpressumBot/1.0; +https://example.com)'
      }
    });
    
    if (!impressumResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch Impressum: HTTP ${impressumResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const impressumHtml = await impressumResponse.text();
    
    // Parse the Impressum content
    const parsedData = parseImpressum(impressumHtml);
    
    // Add source URL to the result
    const result: ImpressumData = {
      company: parsedData.company || "Unknown",
      address: parsedData.address || "Unknown",
      phone: parsedData.phone || null,
      email: parsedData.email || null,
      ceos: parsedData.ceos || [],
      source: impressumUrl
    };
    
    // Return the structured data
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in scrape-impressum function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
