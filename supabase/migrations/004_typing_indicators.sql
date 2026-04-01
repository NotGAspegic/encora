-- supabase/migrations/004_typing_indicators.sql

CREATE TABLE IF NOT EXISTS public.typing_indicators (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, conversation_id)
);

-- Index for querying who is typing in a given conversation
CREATE INDEX IF NOT EXISTS idx_typing_conversation
  ON public.typing_indicators(conversation_id);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Auto-clean stale typing indicators older than 10 seconds
-- This runs as a Postgres function called by a cron job (set up in Step 9)
CREATE OR REPLACE FUNCTION public.clean_stale_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$;