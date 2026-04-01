-- supabase/migrations/003_messages.sql

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Encrypted payload — plaintext NEVER stored here
  ciphertext      TEXT NOT NULL,
  iv              TEXT NOT NULL,

  -- Read receipt — NULL means unread
  read_at         TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Sanity limits to prevent abuse
  CONSTRAINT ciphertext_length CHECK (length(ciphertext) BETWEEN 1 AND 100000),
  CONSTRAINT iv_length CHECK (length(iv) BETWEEN 16 AND 32)
);

-- Primary query pattern: fetch all messages for a conversation, ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at ASC);

-- For read receipt updates — finding unread messages sent to the current user
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages(sender_id);

-- For unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at
  ON public.messages(read_at)
  WHERE read_at IS NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;