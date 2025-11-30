-- Migration: add decline tracking columns for user approvals
-- Purpose: allow vets/admins to decline fake or incomplete accounts

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS declined BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS declined_reason TEXT;

COMMIT;

