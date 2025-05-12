
-- Add new validation fields to scraper_feedback table
ALTER TABLE public.scraper_feedback ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.scraper_feedback ADD COLUMN IF NOT EXISTS validation_result TEXT CHECK (validation_result IN ('valid', 'invalid'));

-- Update the comment for the table
COMMENT ON COLUMN public.scraper_feedback.validated IS 'Whether this field was explicitly validated by a user';
COMMENT ON COLUMN public.scraper_feedback.validation_result IS 'Whether the user marked the extracted value as valid or invalid';

-- Create an index to help with analyzing validation results
CREATE INDEX IF NOT EXISTS idx_scraper_feedback_validation ON public.scraper_feedback(validated, validation_result);
