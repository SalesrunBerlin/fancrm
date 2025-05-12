import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { load } from "https://esm.sh/cheerio@1.0.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to fetch HTML from a URL
async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching HTML:", error);
    throw error;
  }
}

// Function to find the Impressum/Imprint page URL
async function findImpressumPage(html: string, baseUrl: string): Promise<string> {
  try {
    const $ = load(html);
    
    // Look for common Impressum/Imprint links
    const patterns = [
      'a[href*="impressum"i]', 
      'a[href*="imprint"i]',
      'a[href*="legal"i]',
      'a[href*="kontakt"i]',
      'a[href*="contact"i]',
      'a[href*="about"i]',
      'a[href*="disclaimer"i]',
      'a:contains("Impressum")', 
      'a:contains("Imprint")',
      'a:contains("Legal")',
      'a:contains("Kontakt")',
      'a:contains("Contact")',
      'a:contains("About Us")'
    ];
    
    for (const pattern of patterns) {
      const links = $(pattern);
      if (links.length > 0) {
        const href = links.first().attr('href');
        if (href) {
          // Handle relative URLs
          if (href.startsWith('http')) {
            return href;
          } else if (href.startsWith('/')) {
            const url = new URL(baseUrl);
            return `${url.protocol}//${url.host}${href}`;
          } else {
            return new URL(href, baseUrl).href;
          }
        }
      }
    }
    
    // If no Impressum link found, use the current page
    return baseUrl;
  } catch (error) {
    console.error("Error finding Impressum page:", error);
    return baseUrl;
  }
}

// Function to extract HTML context for a specific value
function findHtmlContext(html: string, value: string): string | null {
  try {
    const $ = load(html);
    let context = null;
    
    // Search the full HTML for the exact value
    $('*:contains("' + value + '")').each((_, el) => {
      const $el = $(el);
      
      // Skip if it's just a container with many children
      if ($el.children().length > 5) return;
      
      // Check if this element contains the exact text
      const text = $el.text().trim();
      if (text.includes(value)) {
        // Get the parent element for better context
        const $parent = $el.parent();
        context = $parent.length ? $parent.html() : $el.html();
        return false; // Break the each loop
      }
    });
    
    return context;
  } catch (error) {
    console.error("Error finding HTML context:", error);
    return null;
  }
}

// Function to extract company information from an Impressum page
function parseImpressumPage(html: string, url: string): any {
  try {
    const $ = load(html);
    const text = $('body').text();
    
    // Extract company name
    const companyRegex = /(?:firma|unternehmen|company|angaben gemäß § 5 tmg|gemäß § 5 tmg|§ 5 tmg|name):?\s*([^\n\r]+?)(?:\n|gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\.)/i;
    const companyMatch = text.match(companyRegex);
    let companyName = null;
    let companyConfidence = 0;
    let companyMethod = "";
    let companyContext = null;
    
    if (companyMatch && companyMatch[1]) {
      companyName = companyMatch[1].trim();
      companyConfidence = 0.8;
      companyMethod = "regex";
      
      // Get HTML context
      const companyEl = $('*:contains("' + companyName + '")').first();
      if (companyEl.length) {
        companyContext = companyEl.parent().html();
      }
      
      // If company name doesn't include legal form, check for it
      if (!/gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\./i.test(companyName)) {
        const legalFormMatch = text.match(/(gmbh|ug|ag|ohg|kg|gbr|e\.v\.|e\. v\.|e\.k\.)/i);
        if (legalFormMatch) {
          companyName += ' ' + legalFormMatch[1];
        }
      }
    } else {
      // Fallback: look for h1/h2 that might contain company name
      const heading = $('h1, h2').first().text().trim();
      if (heading && !/(impressum|imprint|kontakt|contact)/i.test(heading)) {
        companyName = heading;
        companyConfidence = 0.6;
        companyMethod = "heading";
        companyContext = $('h1, h2').first().parent().html();
      } else {
        // Last resort: look for strong/b tags that might be company names
        const bold = $('strong, b').first().text().trim();
        if (bold && bold.length > 3 && bold.length < 50) {
          companyName = bold;
          companyConfidence = 0.4;
          companyMethod = "bold";
          companyContext = $('strong, b').first().parent().html();
        }
      }
    }
    
    // Extract address
    const addressRegex = /(?:adresse|address|anschrift|sitz|straße|strasse)(?:[:\s]*)((?:(?:[^\n\r,]|,\s*(?!\d))+?)\s*,?\s*(?:\d{5}|\d{4})\s+[^\n\r,]+(?:,\s*[^\n\r]+)?)/i;
    const addressMatch = text.match(addressRegex);
    let address = null;
    let addressConfidence = 0;
    let addressMethod = "";
    let addressContext = null;
    
    if (addressMatch && addressMatch[1]) {
      address = addressMatch[1].trim();
      addressConfidence = 0.8;
      addressMethod = "regex";
      
      // Get HTML context
      const addressEl = $('*:contains("' + address + '")').first();
      if (addressEl.length) {
        addressContext = addressEl.parent().html();
      }
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
              address = (line.trim() + ' ' + postalAndCity).replace(/\s+/g, ' ');
              addressConfidence = 0.7;
              addressMethod = "postal-pattern";
              break;
            }
          }
        }
        
        if (!address) {
          address = postalAndCity.trim();
          addressConfidence = 0.5;
          addressMethod = "postal-only";
        }
        
        // Get HTML context
        const addressEl = $('*:contains("' + address + '")').first();
        if (addressEl.length) {
          addressContext = addressEl.parent().html();
        }
      }
    }
    
    // Extract phone number
    const phoneRegex = /(?:(?:tel(?:efon)?|phone|fon)(?:[.:]\s*|\s*[:]\s*|\s*[\/]?\s*|\s+))([+\d\s\/\(\)-]{7,})/i;
    const phoneMatch = text.match(phoneRegex);
    let phone = null;
    let phoneConfidence = 0;
    let phoneMethod = "";
    let phoneContext = null;
    
    if (phoneMatch && phoneMatch[1]) {
      phone = phoneMatch[1].trim().replace(/\s+/g, ' ');
      phoneConfidence = 0.8;
      phoneMethod = "regex";
      
      // Get HTML context
      const phoneEl = $('*:contains("' + phone + '")').first();
      if (phoneEl.length) {
        phoneContext = phoneEl.parent().html();
      }
    } else {
      // Look for tel: links
      const telLinks = $('a[href^="tel:"]');
      if (telLinks.length > 0) {
        const href = telLinks.first().attr('href');
        if (href) {
          phone = href.replace('tel:', '');
          phoneConfidence = 0.9;
          phoneMethod = "tel-link";
          phoneContext = telLinks.first().parent().html();
        }
      }
    }
    
    // Extract email address
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    let email = null;
    let emailConfidence = 0;
    let emailMethod = "";
    let emailContext = null;
    
    if (emailMatch) {
      email = emailMatch[0];
      emailConfidence = 0.8;
      emailMethod = "regex";
      
      // Get HTML context
      const emailEl = $('*:contains("' + email + '")').first();
      if (emailEl.length) {
        emailContext = emailEl.parent().html();
      }
    } else {
      // Look for mailto: links
      const mailtoLinks = $('a[href^="mailto:"]');
      if (mailtoLinks.length > 0) {
        const href = mailtoLinks.first().attr('href');
        if (href) {
          email = href.replace('mailto:', '');
          emailConfidence = 0.9;
          emailMethod = "mailto";
          emailContext = mailtoLinks.first().parent().html();
        }
      }
    }
    
    // Extract CEOs/managing directors
    const ceosRegex = /(?:geschäftsführ(?:er|ung)|ceo|managing director|vertretungsberechtigte[r]?|vertreten durch|direktor)(?:[:\s]*)((?:[^\n\r]+?)(?:$|\n))/i;
    const ceosMatch = text.match(ceosRegex);
    let ceos: { value: string, conf: number, method: string, context?: string }[] = [];
    
    if (ceosMatch && ceosMatch[1]) {
      // Split by common separators
      const ceosStr = ceosMatch[1].replace(/\([^)]*\)/g, '').trim();
      const ceosArray = ceosStr
        .split(/(?:,|&|und|and|\||\n)/i)
        .map(name => name.trim())
        .filter(name => name.length > 2 && !/(?:ist|is|are|gmbh|ag|ug)/i.test(name));
      
      ceos = ceosArray.map(ceo => {
        // Get HTML context for each CEO
        const ceoEl = $('*:contains("' + ceo + '")').first();
        const context = ceoEl.length ? ceoEl.parent().html() : null;
        
        return {
          value: ceo,
          conf: 0.7,
          method: "regex",
          context
        };
      });
    }
    
    // Check for structured data (JSON-LD)
    const jsonLdScripts = $('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      jsonLdScripts.each((_, script) => {
        try {
          const jsonLd = JSON.parse($(script).html() || '{}');
          
          // Check for Organization data
          if (jsonLd['@type'] === 'Organization' || jsonLd['@type'] === 'LocalBusiness') {
            if (jsonLd.name && !companyName) {
              companyName = jsonLd.name;
              companyConfidence = 0.9;
              companyMethod = "jsonld";
              companyContext = $(script).html();
            }
            
            if (jsonLd.address) {
              let jsonAddress = '';
              if (typeof jsonLd.address === 'string') {
                jsonAddress = jsonLd.address;
              } else if (jsonLd.address.streetAddress) {
                jsonAddress = [
                  jsonLd.address.streetAddress,
                  jsonLd.address.postalCode,
                  jsonLd.address.addressLocality,
                  jsonLd.address.addressCountry
                ].filter(Boolean).join(', ');
              }
              
              if (jsonAddress && (!address || addressConfidence < 0.9)) {
                address = jsonAddress;
                addressConfidence = 0.9;
                addressMethod = "jsonld";
                addressContext = $(script).html();
              }
            }
            
            if (jsonLd.telephone && (!phone || phoneConfidence < 0.9)) {
              phone = jsonLd.telephone;
              phoneConfidence = 0.9;
              phoneMethod = "jsonld";
              phoneContext = $(script).html();
            }
            
            if (jsonLd.email && (!email || emailConfidence < 0.9)) {
              email = jsonLd.email;
              emailConfidence = 0.9;
              emailMethod = "jsonld";
              emailContext = $(script).html();
            }
          }
        } catch (e) {
          console.error("Error parsing JSON-LD:", e);
        }
      });
    }
    
    // Prepare the result
    const result = {
      fields: {
        company: companyName ? [{ value: companyName, conf: companyConfidence, method: companyMethod, context: companyContext }] : [],
        address: address ? [{ value: address, conf: addressConfidence, method: addressMethod, context: addressContext }] : [],
        phone: phone ? [{ value: phone, conf: phoneConfidence, method: phoneMethod, context: phoneContext }] : [],
        email: email ? [{ value: email, conf: emailConfidence, method: emailMethod, context: emailContext }] : [],
        ceos: ceos
      }
    };
    
    return result;
  } catch (error) {
    console.error("Error parsing Impressum page:", error);
    return {
      fields: {
        company: [],
        address: [],
        phone: [],
        email: [],
        ceos: []
      }
    };
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, searchValue } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch HTML from URL
    const html = await fetchHtml(url);
    
    // If searchValue is provided, find HTML context for that specific value
    if (searchValue) {
      const htmlContext = findHtmlContext(html, searchValue);
      return new Response(
        JSON.stringify({ 
          htmlContext,
          source: url
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    // Otherwise process as a normal impressum scrape
    else {
      // Find Impressum page URL
      const impressumUrl = await findImpressumPage(html, url);
      
      // If different from original URL, fetch the Impressum page HTML
      const impressumHtml = impressumUrl !== url ? await fetchHtml(impressumUrl) : html;
      
      // Parse the Impressum page
      const result = parseImpressumPage(impressumHtml, impressumUrl);
      
      return new Response(
        JSON.stringify({ 
          ...result,
          source: impressumUrl
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
