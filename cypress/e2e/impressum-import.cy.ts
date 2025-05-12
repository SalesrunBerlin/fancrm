
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

    // Mock the Impressum scraping results
    cy.intercept('POST', '/functions/v1/scrape-impressum', {
      statusCode: 200,
      body: {
        company: 'Test Company GmbH',
        address: 'Teststraße 123, 10115 Berlin',
        phone: '+49 30 12345678',
        email: 'info@testcompany.de',
        ceos: ['John Doe', 'Jane Smith'],
        source: 'https://example.com/impressum',
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
    cy.get('input#company-name').should('have.value', 'Test Company GmbH');
    cy.get('input#address').should('have.value', 'Teststraße 123, 10115 Berlin');

    // Verify CEO checkboxes are shown
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');

    // Proceed with company creation
    cy.contains('button', 'Create Company').click();

    // Verify success message
    cy.contains('Company "Test Company GmbH" created successfully').should('be.visible');
  });

  it('should validate required fields before submission', () => {
    // Enter a URL and click scrape
    cy.get('input[placeholder="https://example.com"]').type('https://example.com');
    cy.contains('button', 'Scrape').click();

    // Clear required fields
    cy.get('input#company-name').clear();
    
    // Verify the button is disabled
    cy.contains('button', 'Create Company').should('be.disabled');

    // Re-enter required fields
    cy.get('input#company-name').type('New Company Name');
    
    // Verify the button is enabled
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
