-- supabase/migrations/002_conversations.sql

CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate conversations between the same pair
  -- We enforce canonical order (a < b) via a check constraint
  CONSTRAINT no_self_conversation CHECK (participant_a != participant_b),
  CONSTRAINT canonical_order CHECK (participant_a < participant_b),
  CONSTRAINT unique_conversation UNIQUE (participant_a, participant_b)
);

-- Index for fast lookup of all conversations a user is part of
CREATE INDEX IF NOT EXISTS idx_conversations_participant_a
  ON public.conversations(participant_a);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_b
  ON public.conversations(participant_b);

-- Enable RLS (policies added in 005)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;