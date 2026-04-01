-- supabase/migrations/005_rls_policies.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone authenticated can read any profile (needed for searching users,
-- showing avatars, and fetching public keys for encryption)
CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile row
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- A user can only see conversations they are part of
CREATE POLICY "Participants can view their conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_a
    OR auth.uid() = participant_b
  );

-- A user can only create a conversation where they are one of the participants
CREATE POLICY "Users can create conversations they participate in"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_a
    OR auth.uid() = participant_b
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────────────────────────────────────

-- Only conversation participants can read messages
CREATE POLICY "Participants can read messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Users can only insert messages where:
--   1. They are the sender
--   2. They are a participant in that conversation
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Only the RECIPIENT can mark a message as read
-- (sender_id != auth.uid() ensures you can't mark your own sent messages as read)
CREATE POLICY "Recipients can mark messages as read"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  )
  WITH CHECK (
    -- Only allow updating read_at — prevent modifying ciphertext or iv
    sender_id = messages.sender_id
    AND conversation_id = messages.conversation_id
    AND ciphertext = messages.ciphertext
    AND iv = messages.iv
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- TYPING INDICATORS
-- ─────────────────────────────────────────────────────────────────────────────

-- Participants can see who is typing in their conversations
CREATE POLICY "Participants can view typing indicators"
  ON public.typing_indicators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = typing_indicators.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Users can only insert/update their own typing indicator
CREATE POLICY "Users can upsert own typing indicator"
  ON public.typing_indicators
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own typing indicator"
  ON public.typing_indicators
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own typing indicator
CREATE POLICY "Users can delete own typing indicator"
  ON public.typing_indicators
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());