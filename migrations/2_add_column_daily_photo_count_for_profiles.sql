-- ============================================================================
-- daily_photo_count yönetimi
-- - base users: günlük hak = 1
-- - premium users: günlük hak = 100
-- - foto yukleyince (base): daily_photo_count = 0
-- - her gun 05:00 (Europe/Istanbul): haklar resetlenir
-- ============================================================================

-- 1) Gerekli kolonlar
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_photo_count integer NOT NULL DEFAULT 1;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_photo_reset timestamptz;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_daily_photo_count_non_negative;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_daily_photo_count_non_negative CHECK (daily_photo_count >= 0);

-- 2) Yardimci fonksiyonlar
CREATE OR REPLACE FUNCTION public.get_daily_photo_quota(p_user_type text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_user_type = 'premium' THEN 100 ELSE 1 END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_reset_point_5am_istanbul(p_now timestamptz DEFAULT now())
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  local_now timestamp;
  local_reset timestamp;
BEGIN
  local_now := p_now AT TIME ZONE 'Europe/Istanbul';
  local_reset := date_trunc('day', local_now) + interval '5 hours';

  IF local_now < local_reset THEN
    local_reset := local_reset - interval '1 day';
  END IF;

  RETURN local_reset AT TIME ZONE 'Europe/Istanbul';
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_user_daily_photo_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_quota integer;
  v_reset_point timestamptz;
BEGIN
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_user_type IS NULL THEN
    RETURN;
  END IF;

  v_quota := public.get_daily_photo_quota(v_user_type);
  v_reset_point := public.get_daily_reset_point_5am_istanbul();

  UPDATE public.profiles
  SET
    daily_photo_count = v_quota,
    last_photo_reset = now()
  WHERE id = p_user_id
    AND (
      last_photo_reset IS NULL
      OR last_photo_reset < v_reset_point
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_all_daily_photo_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reset_point timestamptz;
BEGIN
  v_reset_point := public.get_daily_reset_point_5am_istanbul();

  UPDATE public.profiles p
  SET
    daily_photo_count = public.get_daily_photo_quota(p.user_type),
    last_photo_reset = now()
  WHERE p.last_photo_reset IS NOT NULL
    AND p.last_photo_reset < v_reset_point;
END;
$$;

-- 3) Ilk backfill (mevcut kullanicilara dogru degerleri yaz)
UPDATE public.profiles
SET
  daily_photo_count = public.get_daily_photo_quota(user_type);

-- 4) user_type degisirse anlik kota duzeltmesi
CREATE OR REPLACE FUNCTION public.set_daily_photo_count_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.daily_photo_count := public.get_daily_photo_quota(COALESCE(NEW.user_type, 'base'));
    -- Kolon DEFAULT now() olsa bile PG once defaultu NEW'e yazar; kayit aninda sifirla
    NEW.last_photo_reset := NULL;
    RETURN NEW;
  END IF;

  IF NEW.user_type IS DISTINCT FROM OLD.user_type THEN
    NEW.daily_photo_count := public.get_daily_photo_quota(COALESCE(NEW.user_type, 'base'));
    NEW.last_photo_reset := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_set_daily_photo_count ON public.profiles;
CREATE TRIGGER trg_profiles_set_daily_photo_count
BEFORE INSERT OR UPDATE OF user_type
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_daily_photo_count_on_profile_change();

-- 5) Foto yukleme sirasinda (base user) daily_photo_count = 0
CREATE OR REPLACE FUNCTION public.consume_daily_photo_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_daily_photo_count integer;
BEGIN
  IF NEW.photo_url IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.refresh_user_daily_photo_count(NEW.created_by);

  SELECT user_type, daily_photo_count
  INTO v_user_type, v_daily_photo_count
  FROM public.profiles
  WHERE id = NEW.created_by
  FOR UPDATE;

  IF v_user_type IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_user_type = 'base' THEN
    IF COALESCE(v_daily_photo_count, 0) <= 0 THEN
      RAISE EXCEPTION 'Base users can upload only 1 photo per day until 05:00.';
    END IF;

    UPDATE public.profiles
    SET
      daily_photo_count = 0,
      last_photo_reset = now()
    WHERE id = NEW.created_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memories_consume_daily_photo_quota ON public.memories;
CREATE TRIGGER trg_memories_consume_daily_photo_quota
BEFORE INSERT ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.consume_daily_photo_quota();

DROP TRIGGER IF EXISTS trg_shared_places_consume_daily_photo_quota ON public.shared_places;
CREATE TRIGGER trg_shared_places_consume_daily_photo_quota
BEFORE INSERT ON public.shared_places
FOR EACH ROW
EXECUTE FUNCTION public.consume_daily_photo_quota();

-- 6) Supabase pg_cron ile her gun 05:00 (Europe/Istanbul ~= UTC+3 => 02:00 UTC) reset
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('reset-daily-photo-count-5am-tr');
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
END;
$$;

SELECT cron.schedule(
  'reset-daily-photo-count-5am-tr',
  '0 2 * * *',
  $$SELECT public.reset_all_daily_photo_counts();$$
);
