
// Test suite for the scrape-impressum Edge Function
// To run: deno test --allow-net --allow-env

import { assertEquals, assertExists } from "https://deno.land/std@0.186.0/testing/asserts.ts";
import { parseImpressum, ImpressumData } from "./index.ts";

// Mock HTML for testing the parser
const mockHtml = `
<html>
<body>
  <h1>Impressum</h1>
  <p>
    Firma: Testfirma GmbH<br>
    Teststraße 1<br>
    10115 Berlin<br>
    Deutschland
  </p>
  <p>
    Tel: +49 30 123456789<br>
    Email: info@testfirma.de
  </p>
  <p>
    Geschäftsführer: Max Muster
  </p>
  <div>
    <a href="mailto:contact@testfirma.de">Email Us</a>
  </div>
</body>
</html>
`;

// Mock HTML for Tantum IT example
const tantumItMockHtml = `
<html>
<body>
  <h1>Impressum</h1>
  <p>
    <strong>tantum IT GmbH</strong><br>
    Uhlandstraße 2<br>
    70182 Stuttgart<br>
    Deutschland
  </p>
  <p>
    Telefon: +49 711 213571-0<br>
    E-Mail: info@tantum-it.de
  </p>
  <p>
    Vertretungsberechtigter Geschäftsführer: Daniel Häusser
  </p>
  <div>
    <a href="mailto:info@tantum-it.de">Email us</a>
  </div>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "tantum IT GmbH",
    "url": "https://www.tantum-it.de",
    "logo": "https://www.tantum-it.de/wp-content/uploads/2022/09/tantum_logo.svg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+49 711 213571-0",
      "email": "info@tantum-it.de"
    }
  }
  </script>
</body>
</html>
`;

Deno.test("parseImpressum should extract company data correctly", () => {
  const result = parseImpressum(mockHtml);
  
  assertExists(result.fields.company);
  assertEquals(result.fields.company.length > 0, true);
  assertEquals(result.fields.company[0].value, "Testfirma GmbH");
  
  assertExists(result.fields.phone);
  assertEquals(result.fields.phone.length > 0, true);
  assertEquals(result.fields.phone[0].value, "+49 30 123456789");
  
  assertExists(result.fields.email);
  assertEquals(result.fields.email.length >= 2, true);
  
  // Email from mailto link should have higher confidence
  const mailtoEmail = result.fields.email.find(e => e.method === 'mailto');
  assertEquals(mailtoEmail?.value, "contact@testfirma.de");
  assertEquals(mailtoEmail?.conf >= 0.9, true);
  
  assertExists(result.fields.ceos);
  assertEquals(result.fields.ceos.length > 0, true);
  assertEquals(result.fields.ceos[0].value, "Max Muster");
});

Deno.test("parseImpressum should handle Tantum IT format correctly", () => {
  const result = parseImpressum(tantumItMockHtml);
  
  // Check company name with both regex and jsonld methods
  assertExists(result.fields.company);
  assertEquals(result.fields.company.length >= 2, true);
  
  // JSON-LD should be highest confidence
  assertEquals(result.fields.company[0].method, "jsonld");
  assertEquals(result.fields.company[0].value, "tantum IT GmbH");
  assertEquals(result.fields.company[0].conf, 1.0);
  
  // Email should have mailto as highest priority
  assertEquals(result.fields.email[0].method, "mailto");
  assertEquals(result.fields.email[0].value, "info@tantum-it.de");
  
  // CEO should be found
  const ceoCandidate = result.fields.ceos.find(c => 
    c.value.toLowerCase().includes("häusser") || c.value.toLowerCase().includes("hausser"));
  assertExists(ceoCandidate);
  assertEquals(ceoCandidate?.value.includes("Daniel"), true);
});
