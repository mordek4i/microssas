-- Migration: 20261013000001_enable_realtime_appointments.sql
-- Description: Enable Supabase Realtime publication on public.appointments table

DO $$
BEGIN
  -- 1. Check if appointments table is already part of supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;

-- Comment for reference:
-- REPLICA IDENTITY is kept as DEFAULT to avoid unnecessary WAL amplification.
-- Deletion events trigger debounced state synchronization in AppContext.
