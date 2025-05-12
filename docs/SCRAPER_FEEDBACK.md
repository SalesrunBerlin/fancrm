

# 🔄 Impressum Scraper Feedback Loop

This document describes the feedback collection and improvement system for the Impressum scraper.

## Overview

The system collects user corrections and validation decisions for the Impressum scraper's output, stores them in a database, and uses this data to test and improve future versions of the scraper. This creates a continuous feedback loop that helps the scraper get better over time.

## Components

### 1. Feedback Collection

When users validate and correct data during the Impressum import process, the system captures:

- Initial value (what the scraper extracted)
- Correct value (what the user selected or entered)
- Validation decision (user explicitly marked as valid/invalid)
- Extraction method used
- Confidence score
- HTML snippet where the data was found
- Source URL and domain

This feedback is sent to the `log_feedback` Edge Function and stored in the `scraper_feedback` table.

### 2. Enhanced Context Collection

When users enter a manually corrected value:
- The system attempts to find where this value appears in the original HTML
- It extracts the surrounding context to help improve future extraction patterns
- This context is stored with the feedback for analysis

### 3. Mandatory Validation

Users must now explicitly validate each field by clicking:
- ✓ (check) if the extracted value is correct
- ✗ (cross) if the extracted value is incorrect

This ensures we collect high-quality feedback for ALL fields, not just those that are corrected.

### 4. Nightly Export

A scheduled function runs daily at 02:00 UTC to:

- Export the previous day's feedback to CSV
- Store the CSV file in the `scraper-feedback` storage bucket
- Maintain data retention policy (24 months)

### 5. Regression Testing

When developers modify the scraper code, a GitHub Action automatically:

- Downloads the latest feedback data
- Tests the new scraper version against known-good data
- Verifies that accuracy remains above 95%
- Fails the build if accuracy drops below threshold

## Schema

The `scraper_feedback` table stores:

| Column            | Description                              |
|-------------------|------------------------------------------|
| id                | UUID primary key                         |
| url               | Source URL                               |
| domain            | Domain name (extracted from URL)         |
| field_type        | Type of field (company, address, etc.)   |
| initial_value     | Value originally extracted by scraper    |
| correct_value     | Value approved/corrected by user         |
| extraction_method | Method used (regex, jsonld, etc.)        |
| confidence        | Confidence score (0-1)                   |
| html_snippet      | Sanitized HTML context (max 10KB)        |
| user_hash         | Anonymized user identifier               |
| validated         | Whether field was explicitly validated   |
| validation_result | Whether extraction was valid/invalid     |
| created_at        | Timestamp                                |

## Privacy and Security

- HTML snippets are truncated to 10KB max and sanitized to remove PII
- Email addresses are replaced with `<EMAIL>` placeholders
- User IDs are hashed with a salt to preserve anonymity while allowing pattern analysis
- RLS policies restrict access to the feedback data

## How to Access Feedback Data

The feedback data is available to developers through:

1. Daily CSV exports in the `scraper-feedback` storage bucket
2. Direct SQL queries to the `scraper_feedback` table (requires service role)

## Development Workflow

1. When making changes to the scraper:
   - Review recent feedback to identify patterns of issues
   - Improve extraction methods based on real-world examples
   - Run regression tests locally before submitting PR

2. The GitHub Action `scraper-regression.yml` will:
   - Run automatically on PRs that change scraper code
   - Validate that changes don't break existing functionality
   - Ensure accuracy remains high for previously corrected cases

