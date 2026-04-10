-- ============================================================================
-- last_photo_reset: Hesap acilisinda doldurulmaz; NULL kalir.
-- Ilk anı / harita fotosu (photo_url dolu) yuklemesinde DB tetikleyicileri set eder.
-- ============================================================================

-- 1) Kolon kisitlari
ALTER TABLE public.profiles
  ALTER COLUMN last_photo_reset DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN last_photo_reset DROP NOT NULL;

-- 2) Daha once hic foto yuklememis profiller: eski yanlis zaman damgasini temizle
UPDATE public.profiles p
SET last_photo_reset = NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM public.memories m
  WHERE m.created_by = p.id
    AND m.photo_url IS NOT NULL
    AND btrim(m.photo_url) <> ''
)
AND NOT EXISTS (
  SELECT 1
  FROM public.shared_places sp
  WHERE sp.created_by = p.id
    AND sp.photo_url IS NOT NULL
    AND btrim(sp.photo_url) <> ''
);

-- 3) Gunluk reset: sadece en az bir kez foto periyodu baslamis olanlar
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

-- 4) Profil INSERT: DEFAULT now() NEW satirina yazilmissa sifirla
CREATE OR REPLACE FUNCTION public.set_daily_photo_count_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.daily_photo_count := public.get_daily_photo_quota(COALESCE(NEW.user_type, 'base'));
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

-- 5) auth.users kaydinda profil satiri: last_photo_reset acikca NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, match_code, last_photo_reset)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    public.generate_match_code(),
    NULL
  );

  RETURN NEW;
END;
$$;
