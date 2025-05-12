import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

// Types for our Impressum data
export interface ImpressumCandidate {
  value: string;
  method: string; // regex, microdata, mailto, etc.
  conf: number;  // confidence 0.1-1.0
}

export interface ImpressumData {
  fields: {
    company: ImpressumCandidate[];
    address: ImpressumCandidate[];
    phone: ImpressumCandidate[];
    email: ImpressumCandidate[];
    ceos: ImpressumCandidate[];
  };
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
export function parseImpressum(html: string): ImpressumData {
  const $ = load(html);
  const text = $('body').text();
  const result: ImpressumData = {
    fields: {
      company: [],
      address: [],
      phone: [],
      email: [],
      ceos: []
    },
    source: ""
  };

  // Extract company name - using multiple methods
  
  // Method 1: Look for microdata or JSON-LD
  try {
    // Try to find JSON-LD script
    const jsonldScripts = $('script[type="application/ld+json"]');
    jsonldScripts.each((_, script) => {
      try {
        const jsonData = JSON.parse($(script).html() || '{}');
        // Look for organization data
        if (jsonData['@type'] === 'Organization' && jsonData.name) {
          result.fields.company.push({
            value: jsonData.name,
            method: 'jsonld',
            conf: 1.0
          });
        }
        // Look for LocalBusiness data
        else if (jsonData['@type'] === 'LocalBusiness' && jsonData.name) {
          result.fields.company.push({
            value: jsonData.name,
            method: 'jsonld',
            conf: 1.0
          });
        }
        // Handle nested structures
        else if (jsonData['@graph']) {
          const organizations = jsonData['@graph'].filter(
            (item: any) => item['@type'] === 'Organization' || item['@type'] === 'LocalBusiness'
          );
          organizations.forEach((org: any) => {
            if (org.name) {
              result.fields.company.push({
                value: org.name,
                method: 'jsonld',
                conf: 1.0
              });
              
              // Also try to get address from this source if available
              if (org.address) {
                let addressStr = '';
                if (typeof org.address === 'string') {
                  addressStr = org.address;
                } else if (org.address.streetAddress) {
                  // Schema.org address format
                  const addr = org.address;
                  const parts = [
                    addr.streetAddress,
                    addr.postalCode,
                    addr.addressLocality,
                    addr.addressRegion,
                    addr.addressCountry
                  ].filter(Boolean);
                  addressStr = parts.join(', ');
                }
                
                if (addressStr) {
                  result.fields.address.push({
                    value: addressStr,
                    method: 'jsonld',
                    conf: 1.0
                  });
                }
              }
            }
          });
        }
      } catch (e) {
        console.error('Error parsing JSON-LD:', e);
      }
    });
    
    // Look for microdata
    const itemProps = $('[itemprop="name"]');
    itemProps.each((_, elem) => {
      const scope = $(elem).closest('[itemscope]');
      if (scope.attr('itemtype')?.includes('Organization') || 
          scope.attr('itemtype')?.includes('LocalBusiness')) {
        result.fields.company.push({
          value: $(elem).text().trim(),
          method: 'microdata',
          conf: 0.9
        });
      }
    });
    
    // Look for address in microdata
    const addressProps = $('[itemprop="address"]');
    addressProps.each((_, elem) => {
      result.fields.address.push({
        value: $(elem).text().trim(),
        method: 'microdata',
        conf: 0.9
      });
    });
  } catch (e) {
    console.error('Error extracting structured data:', e);
  }

  // Method 2: Look for common patterns in text
  const companyRegex = /(?:firma|unternehmen|company|angaben gemäß § 5 tmg|gemäß § 5 tmg|§ 5 tmg|name):?\s*([^\n\r]+?)(?:\n|gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\.)/i;
  const companyMatch = text.match(companyRegex);
  if (companyMatch && companyMatch[1]) {
    let companyName = companyMatch[1].trim();
    // If company name doesn't include legal form, check for it
    if (!/gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\./i.test(companyName)) {
      const legalFormMatch = text.match(/(gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\.)/i);
      if (legalFormMatch) {
        companyName += ' ' + legalFormMatch[1];
      }
    }
    result.fields.company.push({
      value: companyName,
      method: 'regex',
      conf: 0.8
    });
  }

  // Method 3: Look for h1/h2 that might contain company name
  const heading = $('h1, h2').first().text().trim();
  if (heading && !/(impressum|imprint|kontakt|contact)/i.test(heading)) {
    result.fields.company.push({
      value: heading,
      method: 'heading',
      conf: 0.5
    });
  }

  // Method 4: Look for strong/b tags that might be company names
  const boldElements = $('strong, b');
  boldElements.each((i, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length > 3 && text.length < 50) {
      result.fields.company.push({
        value: text,
        method: 'bold',
        conf: 0.3 + (i === 0 ? 0.1 : 0)  // Give slightly higher confidence to first bold element
      });
    }
  });
  
  // Extract address - using multiple methods
  
  // Method 1: Look for common patterns with postal codes
  const addressRegex = /(?:adresse|address|anschrift|sitz|straße|strasse)(?:[:\s]*)((?:(?:[^\n\r,]|,\s*(?!\d))+?)\s*,?\s*(?:\d{5}|\d{4})\s+[^\n\r,]+(?:,\s*[^\n\r]+)?)/i;
  const addressMatch = text.match(addressRegex);
  if (addressMatch && addressMatch[1]) {
    result.fields.address.push({
      value: addressMatch[1].trim(),
      method: 'regex',
      conf: 0.8
    });
  }

  // Method 2: Look for postal code pattern and extract surrounding text
  const postalMatches = text.match(/(\b\d{5}\b|\b\d{4}\b)\s+([A-Za-zäöüÄÖÜß\s\-]+)/g) || [];
  postalMatches.forEach((match, index) => {
    // Find context around postal code
    const postalAndCity = match;
    
    // Look for street address before postal code
    const contextPosition = text.indexOf(postalAndCity);
    if (contextPosition > 0) {
      // Get a chunk of text before the postal code (up to 100 chars)
      const precedingText = text.substring(Math.max(0, contextPosition - 100), contextPosition);
      const streetLines = precedingText.split('\n').slice(-3);
      
      for (const line of streetLines) {
        if (/straße|strasse|weg|allee|gasse|platz|straße|str\./i.test(line)) {
          const fullAddress = (line.trim() + ' ' + postalAndCity).replace(/\s+/g, ' ');
          result.fields.address.push({
            value: fullAddress,
            method: 'postal-context',
            conf: 0.7 - (index * 0.1)  // Decrease confidence for later matches
          });
          break;
        }
      }
    }
    
    // Add the postal code and city as a lower-confidence fallback
    result.fields.address.push({
      value: postalAndCity.trim(),
      method: 'postal-only',
      conf: 0.5 - (index * 0.1)
    });
  });
  
  // Method 3: Look for address in <address> tags
  $('address').each((index, elem) => {
    const addressText = $(elem).text().trim();
    if (addressText && addressText.length > 10) {
      result.fields.address.push({
        value: addressText,
        method: 'address-tag',
        conf: 0.8 - (index * 0.1)
      });
    }
  });

  // Extract phone number - using multiple methods
  
  // Method 1: Look for tel: links
  $('a[href^="tel:"]').each((index, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      const phoneNumber = href.replace('tel:', '').trim();
      result.fields.phone.push({
        value: phoneNumber,
        method: 'tel-link',
        conf: 1.0 - (index * 0.1)
      });
    }
  });
  
  // Method 2: Look for phone patterns in text
  const phoneRegexes = [
    /(?:(?:tel(?:efon)?|phone|fon)(?:[.:]\s*|\s*[:]\s*|\s*[\/]?\s*|\s+))([+\d\s\/\(\)-]{7,})/i,
    /(?:(?:tel(?:efon)?|phone|fon)[.:]\s*)([+\d\s\/\(\)-]{7,})/i,
    /\b((?:\+\d{1,3}[\s\/-]?)(?:\(\d+\)[\s\/-]?)?(?:\d+[\s\/-]?){6,})\b/
  ];
  
  phoneRegexes.forEach((regex, regexIndex) => {
    const phoneMatches = text.match(new RegExp(regex, 'g')) || [];
    phoneMatches.forEach((matchStr, matchIndex) => {
      const match = matchStr.match(regex);
      if (match && match[1]) {
        result.fields.phone.push({
          value: match[1].trim().replace(/\s+/g, ' '),
          method: `regex-${regexIndex + 1}`,
          conf: 0.7 - (regexIndex * 0.1) - (matchIndex * 0.05)
        });
      }
    });
  });

  // Extract email address - using multiple methods
  
  // Method 1: Look for mailto links (highest confidence)
  $('a[href^="mailto:"]').each((index, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      const email = href.replace('mailto:', '').split('?')[0].trim();
      result.fields.email.push({
        value: email,
        method: 'mailto',
        conf: 1.0 - (index * 0.05)
      });
    }
  });
  
  // Method 2: Look for email patterns in text
  const emailRegexes = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    /(?:e-?mail|email|mail|e-mail-adresse)(?:\s*:|:\s*|\s+)([\w.-]+@[\w.-]+\.\w{2,})/i
  ];
  
  emailRegexes.forEach((regex, regexIndex) => {
    const emailMatches = text.match(new RegExp(regex, 'g')) || [];
    emailMatches.forEach((matchStr, matchIndex) => {
      let email;
      if (regexIndex === 0) {
        // First regex - full match is the email
        email = matchStr;
      } else {
        // Second regex - group 1 is the email
        const match = matchStr.match(regex);
        email = match ? match[1] : null;
      }
      
      if (email) {
        result.fields.email.push({
          value: email.trim(),
          method: `regex-${regexIndex + 1}`,
          conf: 0.7 - (regexIndex * 0.1) - (matchIndex * 0.05)
        });
      }
    });
  });

  // Extract CEOs/managing directors - using multiple methods
  
  // Method 1: Look for specific patterns
  const ceosRegexes = [
    /(?:geschäftsführ(?:er|ung)|ceo|managing director|vertretungsberechtigte[r]?|vertreten durch|direktor)(?:[:\s]*)((?:[^\n\r]+?)(?:$|\n))/i,
    /(?:vertretungsberechtigte[r]? (?:ist|sind)|vertreten durch|leitung)(?:[:\s]*)((?:[^\n\r]+?)(?:$|\n))/i
  ];
  
  ceosRegexes.forEach((regex, regexIndex) => {
    const ceosMatch = text.match(regex);
    if (ceosMatch && ceosMatch[1]) {
      // Split by common separators
      const ceosStr = ceosMatch[1].replace(/\([^)]*\)/g, '').trim();
      const ceosList = ceosStr
        .split(/(?:,|&|und|and|\||\n)/i)
        .map(name => name.trim())
        .filter(name => name.length > 2 && !/(?:ist|is|are|gmbh|ag|ug)/i.test(name));
      
      ceosList.forEach((name, nameIndex) => {
        result.fields.ceos.push({
          value: name,
          method: `regex-${regexIndex + 1}`,
          conf: 0.8 - (regexIndex * 0.1) - (nameIndex * 0.05)
        });
      });
    }
  });
  
  // Method 2: Look for itemprop="name" within director context
  $('[itemprop="name"]').each((index, elem) => {
    const scope = $(elem).closest('[itemscope]');
    if (scope.attr('itemtype')?.includes('Person')) {
      // Check if within a context that suggests director/CEO
      const contextText = scope.text().toLowerCase();
      if (/geschäftsführ|ceo|director|vertretung|leitung/i.test(contextText)) {
        result.fields.ceos.push({
          value: $(elem).text().trim(),
          method: 'microdata',
          conf: 0.9 - (index * 0.05)
        });
      }
    }
  });
  
  // Remove duplicates while keeping the highest confidence for each unique value
  ['company', 'address', 'phone', 'email', 'ceos'].forEach(field => {
    const uniqueMap = new Map<string, ImpressumCandidate>();
    
    (result.fields as any)[field].forEach((candidate: ImpressumCandidate) => {
      const normalizedValue = candidate.value.toLowerCase().trim();
      
      // Skip empty values
      if (!normalizedValue) return;
      
      const existing = uniqueMap.get(normalizedValue);
      if (!existing || existing.conf < candidate.conf) {
        uniqueMap.set(normalizedValue, candidate);
      }
    });
    
    // Sort by confidence (highest first)
    (result.fields as any)[field] = Array.from(uniqueMap.values())
      .sort((a, b) => b.conf - a.conf);
      
    // Ensure at least one empty candidate if none found
    if ((result.fields as any)[field].length === 0) {
      (result.fields as any)[field].push({
        value: "",
        method: "none",
        conf: 0.1
      });
    }
  });

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
    const result = parseImpressum(impressumHtml);
    
    // Add source URL to the result
    result.source = impressumUrl;
    
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
