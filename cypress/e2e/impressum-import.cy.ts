
describe('Impressum Import', () => {
  beforeEach(() => {
    // Mock the authentication
    cy.intercept('POST', '/auth/v1/token*', {
      statusCode: 200,
      body: {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: '123',
          email: 'test@example.com',
        },
      },
    });

    // Mock the Impressum scraping results with multiple candidates
    cy.intercept('POST', '/functions/v1/scrape-impressum', {
      statusCode: 200,
      body: {
        fields: {
          company: [
            { value: 'Test Company GmbH', method: 'jsonld', conf: 1.0 },
            { value: 'Company Test', method: 'heading', conf: 0.5 }
          ],
          address: [
            { value: 'Teststraße 123, 10115 Berlin', method: 'regex', conf: 0.8 },
            { value: '10115 Berlin', method: 'postal-only', conf: 0.5 }
          ],
          phone: [
            { value: '+49 30 12345678', method: 'tel-link', conf: 1.0 },
            { value: '030 12345678', method: 'regex', conf: 0.7 }
          ],
          email: [
            { value: 'info@testcompany.de', method: 'mailto', conf: 1.0 },
            { value: 'contact@testcompany.de', method: 'regex', conf: 0.6 }
          ],
          ceos: [
            { value: 'John Doe', method: 'regex', conf: 0.8 },
            { value: 'Jane Smith', method: 'regex', conf: 0.7 }
          ],
        },
        source: 'https://example.com/impressum'
      },
    });

    // Mock the company creation endpoint
    cy.intercept('POST', '/rest/v1/companies', {
      statusCode: 201,
      body: {
        id: 'mock-company-id',
        name: 'Test Company GmbH',
      },
    });

    // Mock the persons creation endpoint
    cy.intercept('POST', '/rest/v1/persons', {
      statusCode: 201,
      body: {
        id: 'mock-person-id',
        full_name: 'John Doe',
      },
    });

    cy.visit('/import/impressum');
  });

  it('should scrape website and create company with persons', () => {
    // Enter a URL and click scrape
    cy.get('input[placeholder="https://example.com"]').type('https://example.com');
    cy.contains('button', 'Scrape').click();

    // Wait for the scraping to complete and check extracted data
    cy.contains('Extracted Company Data').should('be.visible');
    
    // Verify field candidate components are shown
    cy.contains('Company Name').should('be.visible');
    cy.contains('Test Company GmbH').should('be.visible');
    
    // Verify CEO checkboxes are shown
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');

    // Proceed with company creation
    cy.contains('button', 'Create Company').click();

    // Verify success message
    cy.contains('Company "Test Company GmbH" created successfully').should('be.visible');
  });

  it('should allow refining extracted data', () => {
    // Enter a URL and click scrape
    cy.get('input[placeholder="https://example.com"]').type('https://example.com');
    cy.contains('button', 'Scrape').click();

    // Wait for the scraping to complete
    cy.contains('Extracted Company Data').should('be.visible');
    
    // Mark email as invalid (click X button)
    cy.contains('Email').parent().contains('button', 'Invalid').click();
    
    // Select a different email from the dropdown
    cy.get('Select').contains('contact@testcompany.de').click();
    
    // Mark CEO Jane Smith as unselected
    cy.contains('Jane Smith').prev().click();
    
    // Proceed with company creation
    cy.contains('button', 'Create Company').click();

    // Verify success message
    cy.contains('Company "Test Company GmbH" created successfully').should('be.visible');
    
    // If we could inspect the payload, we'd verify that:
    // 1. It contains the alternative email we selected
    // 2. It only includes John Doe in the CEOs list
  });

  it('should validate required fields before submission', () => {
    // Enter a URL and click scrape
    cy.get('input[placeholder="https://example.com"]').type('https://example.com');
    cy.contains('button', 'Scrape').click();

    // Wait for the scraping to complete
    cy.contains('Extracted Company Data').should('be.visible');
    
    // Mark company name as invalid
    cy.contains('Company Name').parent().contains('button', 'Invalid').click();
    
    // Verify the Create Company button is disabled
    cy.contains('button', 'Create Company').should('be.disabled');
    
    // Enter a manual value
    cy.get('Select').contains('Enter manually').click();
    cy.get('input').last().type('New Manual Company Name');
    
    // Verify the button is now enabled
    cy.contains('button', 'Create Company').should('not.be.disabled');
  });

  it('should handle API errors gracefully', () => {
    // Override the mock with an error response
    cy.intercept('POST', '/functions/v1/scrape-impressum', {
      statusCode: 500,
      body: {
        error: 'Failed to scrape Impressum'
      },
    });

    // Enter a URL and click scrape
    cy.get('input[placeholder="https://example.com"]').type('https://example.com');
    cy.contains('button', 'Scrape').click();

    // Verify error message is displayed
    cy.contains('Failed to scrape Impressum').should('be.visible');
  });
});
