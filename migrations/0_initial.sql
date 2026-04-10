-- ==============================================================================
-- SUPABASE RESET + RECREATE (FIXED)
-- Safe for reruns / removes old overloaded functions / recreates triggers & RLS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET search_path = public;

-- ==============================================================================
-- 1. CLEANUP
-- ==============================================================================

-- Drop auth trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop tables
DROP TABLE IF EXISTS public.place_comments CASCADE;
DROP TABLE IF EXISTS public.shared_places CASCADE;
DROP TABLE IF EXISTS public.memories CASCADE;
DROP TABLE IF EXISTS public.photo_upload_events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions (include overloaded signatures too)
DROP FUNCTION IF EXISTS public.check_memory_limits() CASCADE;
DROP FUNCTION IF EXISTS public.check_place_limits() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_type(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_limit_start() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_usage_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_account() CASCADE;
DROP FUNCTION IF EXISTS public.unpair_partner() CASCADE;
DROP FUNCTION IF EXISTS public.match_with_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.complete_relationship_setup(date, date) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_match_code() CASCADE;
DROP FUNCTION IF EXISTS public.generate_match_code(integer) CASCADE;
DROP FUNCTION IF EXISTS public.generate_unique_match_code() CASCADE;

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    match_code text UNIQUE,
    partner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    matched_at timestamptz,
    birth_date date,
    relationship_start_date date,
    user_type text NOT NULL DEFAULT 'base' CHECK (user_type IN ('base', 'premium'))
);

CREATE TABLE public.photo_upload_events (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source text NOT NULL CHECK (source IN ('memory', 'place')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_photo_upload_events_user_created_at
ON public.photo_upload_events(user_id, created_at DESC);

CREATE TABLE public.memories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_a_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    photo_url text,
    memory_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (user_a_id <> user_b_id)
);

CREATE TABLE public.shared_places (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_a_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    address text,
    google_place_id text,
    visited_at timestamptz,
    photo_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (user_a_id <> user_b_id)
);

CREATE TABLE public.place_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id uuid NOT NULL REFERENCES public.shared_places(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_user_type(check_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
BEGIN
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = check_user_id;

  RETURN COALESCE(v_user_type, 'base');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_limit_start()
RETURNS timestamptz
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  now_time timestamptz := now();
  today_reset timestamptz := date_trunc('day', now()) + interval '5 hours';
BEGIN
  IF now_time < today_reset THEN
    RETURN today_reset - interval '1 day';
  END IF;

  RETURN today_reset;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_match_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE match_code = v_code
    );
  END LOOP;

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_with_code(input_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_partner_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id
  INTO v_partner_id
  FROM public.profiles
  WHERE upper(match_code) = upper(trim(input_code))
    AND id <> v_user_id;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Invalid match code';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id IN (v_user_id, v_partner_id)
      AND partner_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Already matched';
  END IF;

  UPDATE public.profiles
  SET partner_id = v_partner_id,
      matched_at = now(),
      updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.profiles
  SET partner_id = v_user_id,
      matched_at = now(),
      updated_at = now()
  WHERE id = v_partner_id;

  RETURN json_build_object('status', 'success', 'partner_id', v_partner_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_relationship_setup(
  partner_birth_date date,
  relationship_start_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_partner_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT partner_id INTO v_partner_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Partner not found';
  END IF;

  UPDATE public.profiles
  SET relationship_start_date = complete_relationship_setup.relationship_start_date,
      updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.profiles
  SET birth_date = partner_birth_date,
      relationship_start_date = complete_relationship_setup.relationship_start_date,
      updated_at = now()
  WHERE id = v_partner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_total_photo_memories int;
  v_total_places int;
  v_today_photo_uploads int;
  v_limit_start timestamptz;
BEGIN
  v_user_type := public.get_user_type(p_user_id);
  v_limit_start := public.get_daily_limit_start();

  SELECT count(*)
  INTO v_total_photo_memories
  FROM public.memories
  WHERE created_by = p_user_id
    AND photo_url IS NOT NULL;

  SELECT count(*)
  INTO v_total_places
  FROM public.shared_places
  WHERE created_by = p_user_id;

  SELECT count(*)
  INTO v_today_photo_uploads
  FROM public.photo_upload_events
  WHERE user_id = p_user_id
    AND created_at >= v_limit_start;

  RETURN json_build_object(
    'user_type', v_user_type,
    'total_photo_memories', v_total_photo_memories,
    'total_places', v_total_places,
    'today_photos', v_today_photo_uploads,
    'max_photo_memories', 8,
    'max_places', 8,
    'max_daily_photos', 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, match_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    public.generate_match_code()
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_memory_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_total_photo_memories int;
  v_today_photo_uploads int;
  v_limit_start timestamptz;
BEGIN
  v_user_type := public.get_user_type(NEW.created_by);

  IF v_user_type = 'premium' THEN
    RETURN NEW;
  END IF;

  IF NEW.photo_url IS NOT NULL THEN
    SELECT count(*) INTO v_total_photo_memories
    FROM public.memories
    WHERE created_by = NEW.created_by
      AND photo_url IS NOT NULL;

    IF v_total_photo_memories >= 8 THEN
      RAISE EXCEPTION 'Upload limit reached';
    END IF;

    v_limit_start := public.get_daily_limit_start();

    SELECT count(*) INTO v_today_photo_uploads
    FROM public.photo_upload_events
    WHERE user_id = NEW.created_by
      AND created_at >= v_limit_start;

    IF v_today_photo_uploads >= 1 THEN
      RAISE EXCEPTION 'Upload limit reached';
    END IF;

    INSERT INTO public.photo_upload_events (user_id, source)
    VALUES (NEW.created_by, 'memory');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_place_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_total_places int;
  v_today_photo_uploads int;
  v_limit_start timestamptz;
BEGIN
  v_user_type := public.get_user_type(NEW.created_by);

  IF v_user_type = 'premium' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_total_places
  FROM public.shared_places
  WHERE created_by = NEW.created_by;

  IF v_total_places >= 8 THEN
    RAISE EXCEPTION 'Place upload limit reached';
  END IF;

  IF NEW.photo_url IS NOT NULL THEN
    v_limit_start := public.get_daily_limit_start();

    SELECT count(*) INTO v_today_photo_uploads
    FROM public.photo_upload_events
    WHERE user_id = NEW.created_by
      AND created_at >= v_limit_start;

    IF v_today_photo_uploads >= 1 THEN
      RAISE EXCEPTION 'Place upload limit reached';
    END IF;

    INSERT INTO public.photo_upload_events (user_id, source)
    VALUES (NEW.created_by, 'place');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unpair_partner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_partner_id uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT partner_id INTO v_partner_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_partner_id IS NOT NULL THEN
    UPDATE public.profiles
    SET partner_id = NULL,
        matched_at = NULL,
        updated_at = now()
    WHERE id IN (v_user_id, v_partner_id);
  END IF;
END;
$$;

-- ==============================================================================
-- 4. TRIGGERS
-- ==============================================================================

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER enforce_memory_limits
BEFORE INSERT ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.check_memory_limits();

CREATE TRIGGER enforce_place_limits
BEFORE INSERT ON public.shared_places
FOR EACH ROW
EXECUTE FUNCTION public.check_place_limits();

-- ==============================================================================
-- 5. RLS
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_upload_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile or partner profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR auth.uid() = partner_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view memories of their couple"
ON public.memories FOR SELECT
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can insert memories for their couple"
ON public.memories FOR INSERT
WITH CHECK ((auth.uid() = user_a_id OR auth.uid() = user_b_id) AND auth.uid() = created_by);

CREATE POLICY "Users can update own memories"
ON public.memories FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own memories"
ON public.memories FOR DELETE
USING (auth.uid() = created_by);

CREATE POLICY "Users can view shared places of their couple"
ON public.shared_places FOR SELECT
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can insert shared places for their couple"
ON public.shared_places FOR INSERT
WITH CHECK ((auth.uid() = user_a_id OR auth.uid() = user_b_id) AND auth.uid() = created_by);

CREATE POLICY "Users can update own shared places"
ON public.shared_places FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own shared places"
ON public.shared_places FOR DELETE
USING (auth.uid() = created_by);

CREATE POLICY "Users can view comments for couple's places"
ON public.place_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.shared_places p
    WHERE p.id = place_id
      AND (auth.uid() = p.user_a_id OR auth.uid() = p.user_b_id)
  )
);

CREATE POLICY "Users can insert comments on couple's places"
ON public.place_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.shared_places p
    WHERE p.id = place_id
      AND (auth.uid() = p.user_a_id OR auth.uid() = p.user_b_id)
  )
);

CREATE POLICY "Users can update own comments"
ON public.place_comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.place_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own upload events"
ON public.photo_upload_events FOR SELECT
USING (auth.uid() = user_id);

-- ==============================================================================
-- 6. REALTIME
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.memories;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.shared_places;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.place_comments;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_places;
ALTER PUBLICATION supabase_realtime ADD TABLE public.place_comments;

-- ==============================================================================
-- DONE
-- ==============================================================================