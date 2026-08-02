-- Add company_country to existing companies table
-- Run this in Supabase SQL Editor

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS company_country text NOT NULL DEFAULT 'United Kingdom';

-- Backfill any unexpected nulls (safety if column existed as nullable before)
UPDATE public.companies
SET company_country = 'United Kingdom'
WHERE company_country IS NULL OR btrim(company_country) = '';
