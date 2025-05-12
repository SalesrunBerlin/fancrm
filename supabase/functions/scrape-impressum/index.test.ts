
// Test suite for the scrape-impressum Edge Function
// To run: deno test --allow-net --allow-env

import { assertEquals, assertExists } from "https://deno.land/std@0.186.0/testing/asserts.ts";
import { parseImpressum } from "./index.ts";

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
</body>
</html>
`;

Deno.test("parseImpressum should extract company data correctly", () => {
  const result = parseImpressum(mockHtml);
  
  assertExists(result.company);
  assertEquals(result.company, "Testfirma GmbH");
  assertEquals(result.phone, "+49 30 123456789");
  assertEquals(result.email, "info@testfirma.de");
  assertEquals(result.ceos?.length, 1);
  assertEquals(result.ceos?.[0], "Max Muster");
});

// Add more tests for edge cases
Deno.test("parseImpressum should handle different formats", () => {
  const englishHtml = `
  <html>
  <body>
    <h1>Imprint</h1>
    <p>
      <strong>Test Ltd.</strong><br>
      123 Test Street<br>
      London W1<br>
      UK
    </p>
    <p>
      Phone: +44 20 12345678<br>
      Email: contact@test.co.uk
    </p>
    <p>
      Directors: John Smith & Jane Doe
    </p>
  </body>
  </html>
  `;
  
  const result = parseImpressum(englishHtml);
  
  assertExists(result.company);
  assertEquals(result.company, "Test Ltd.");
  assertEquals(result.phone, "+44 20 12345678");
  assertEquals(result.email, "contact@test.co.uk");
  assertEquals(result.ceos?.length, 2);
});
