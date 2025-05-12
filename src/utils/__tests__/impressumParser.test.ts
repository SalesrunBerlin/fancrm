
import { parseImpressum } from '../impressumParser';

const minimalImpressumHtml = `
<html>
<body>
  <h1>Impressum</h1>
  <p>
    Firma: Musterfirma GmbH<br>
    Musterstraße 123<br>
    12345 Musterstadt<br>
    Deutschland
  </p>
  <p>
    Tel: +49 123 456789<br>
    E-Mail: info@musterfirma.de
  </p>
  <p>
    Geschäftsführer: Max Mustermann, Jane Doe
  </p>
</body>
</html>
`;

const englishImprintHtml = `
<html>
<body>
  <h1>Imprint</h1>
  <p>
    <strong>Example Company Ltd.</strong><br>
    123 Example Street<br>
    W1 1AA London<br>
    United Kingdom
  </p>
  <p>
    Phone: +44 20 12345678<br>
    Email: contact@example.co.uk
  </p>
  <p>
    Managing Directors: John Smith & Sarah Johnson
  </p>
</body>
</html>
`;

const complexGermanImpressumHtml = `
<html>
<body>
  <h1>Impressum</h1>
  <div class="content">
    <h2>Angaben gemäß § 5 TMG</h2>
    <p>
      Komplexe Technik AG<br>
      Technikstraße 42<br>
      10115 Berlin
    </p>
    <h3>Vertreten durch</h3>
    <p>Dr. Hans Schmidt, Vorstandsvorsitzender<br>
       Prof. Maria Weber, CTO</p>
    
    <h3>Kontakt</h3>
    <p>
      Telefon: +49 (0) 30 / 123 45 67<br>
      Telefax: +49 (0) 30 / 123 45 68<br>
      E-Mail: kontakt@komplexetechnik.de
    </p>
    
    <h3>Registereintrag</h3>
    <p>
      Eintragung im Handelsregister.<br>
      Registergericht: Amtsgericht Berlin-Charlottenburg<br>
      Registernummer: HRB 12345
    </p>
    
    <h3>Umsatzsteuer-ID</h3>
    <p>
      Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br>
      DE 123456789
    </p>
  </div>
</body>
</html>
`;

describe('impressumParser', () => {
  it('should parse minimal German Impressum correctly', () => {
    const result = parseImpressum(minimalImpressumHtml);
    
    expect(result.company).toEqual('Musterfirma GmbH');
    expect(result.address).toMatch(/Musterstraße 123.*12345 Musterstadt/);
    expect(result.phone).toEqual('+49 123 456789');
    expect(result.email).toEqual('info@musterfirma.de');
    expect(result.ceos).toEqual(['Max Mustermann', 'Jane Doe']);
  });
  
  it('should parse English imprint correctly', () => {
    const result = parseImpressum(englishImprintHtml);
    
    expect(result.company).toEqual('Example Company Ltd.');
    expect(result.address).toMatch(/123 Example Street.*W1 1AA London/);
    expect(result.phone).toEqual('+44 20 12345678');
    expect(result.email).toEqual('contact@example.co.uk');
    expect(result.ceos).toContain('John Smith');
    expect(result.ceos).toContain('Sarah Johnson');
  });
  
  it('should parse complex German Impressum correctly', () => {
    const result = parseImpressum(complexGermanImpressumHtml);
    
    expect(result.company).toEqual('Komplexe Technik AG');
    expect(result.address).toMatch(/Technikstraße 42.*10115 Berlin/);
    expect(result.phone).toEqual('+49 (0) 30 / 123 45 67');
    expect(result.email).toEqual('kontakt@komplexetechnik.de');
    expect(result.ceos).toEqual(['Dr. Hans Schmidt', 'Prof. Maria Weber']);
  });
  
  it('should handle missing data gracefully', () => {
    const incompleteHtml = `<html><body><p>Impressum</p></body></html>`;
    const result = parseImpressum(incompleteHtml);
    
    expect(result.company).toBeUndefined();
    expect(result.address).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(result.ceos).toBeUndefined();
  });
});
