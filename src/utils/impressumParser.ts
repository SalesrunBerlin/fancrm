
import { load } from "cheerio";

export interface ImpressumData {
  company: string;
  address: string;
  phone: string | null;
  email: string | null;
  ceos: string[];
  source: string;
}

/**
 * Parses HTML content from an Impressum/Imprint page to extract company information
 * @param html HTML content from Impressum page
 * @returns Structured company data
 */
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
