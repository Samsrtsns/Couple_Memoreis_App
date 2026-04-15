CREATE TABLE IF NOT EXISTS public.special_days (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_a_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (char_length(trim(title)) > 0),
    special_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (user_a_id <> user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_special_days_pair_date
ON public.special_days(user_a_id, user_b_id, special_date);

CREATE INDEX IF NOT EXISTS idx_special_days_created_by
ON public.special_days(created_by);

ALTER TABLE public.special_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view special days of their couple" ON public.special_days;
CREATE POLICY "Users can view special days of their couple"
ON public.special_days FOR SELECT
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Users can insert special days for their couple" ON public.special_days;
CREATE POLICY "Users can insert special days for their couple"
ON public.special_days FOR INSERT
WITH CHECK (
    (auth.uid() = user_a_id OR auth.uid() = user_b_id)
    AND auth.uid() = created_by
);

DROP POLICY IF EXISTS "Users can update own special days" ON public.special_days;
CREATE POLICY "Users can update own special days"
ON public.special_days FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own special days" ON public.special_days;
CREATE POLICY "Users can delete own special days"
ON public.special_days FOR DELETE
USING (auth.uid() = created_by);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.special_days;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;
