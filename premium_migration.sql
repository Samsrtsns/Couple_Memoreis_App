-- ==============================================================================
-- 1. PROFILES TABLOSUNA USER_TYPE EKLENMESİ
-- ==============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'base'
CHECK (user_type IN ('base', 'premium'));

-- ==============================================================================
-- 2. YARDIMCI FONKSİYONLAR
-- ==============================================================================
-- Kullanıcının üyelik tipini getiren yardımcı fonksiyon
CREATE OR REPLACE FUNCTION public.get_user_type(check_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_type text;
BEGIN
  SELECT user_type INTO v_user_type FROM public.profiles WHERE id = check_user_id;
  RETURN COALESCE(v_user_type, 'base');
END;
$$;

-- Gece 05:00 baz alınarak gün dönümü başlangıcını hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION public.get_daily_limit_start()
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  now_time timestamptz := current_timestamp;
  -- Bulunduğumuz günün sabah 05:00'ı:
  today_reset timestamptz := date_trunc('day', now_time) + interval '5 hours';
BEGIN
  IF now_time < today_reset THEN
    -- Eğer saat henüz sabah 05:00 olmadıysa, dünün 05:00'ını baz al
    RETURN today_reset - interval '1 day';
  ELSE
    -- Saat 05:00'ı geçtiyse bugünün 05:00'ını baz al
    RETURN today_reset;
  END IF;
END;
$$;

-- ==============================================================================
-- 3. TRIGGER FONKSİYONLARI (MEMORIES & SHARED_PLACES LİMİT KONTROLÜ)
-- ==============================================================================

-- Günlük fotoğraf hakkını "yükleme olayı" üzerinden takip eder.
-- Böylece kullanıcı aynı gün fotoğrafı silse bile günlük hak geri gelmez.
CREATE TABLE IF NOT EXISTS public.photo_upload_events (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('memory', 'place')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photo_upload_events_user_created_at
  ON public.photo_upload_events(user_id, created_at DESC);

-- Memories (Anılar) limit kontrolü
CREATE OR REPLACE FUNCTION public.check_memory_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_type text;
  v_total_photo_memories int;
  v_today_photo_uploads int;
  v_limit_start timestamptz;
BEGIN
  v_user_type := public.get_user_type(NEW.created_by);
  
  -- Premium kullanıcılar için limitleri es geç
  IF v_user_type = 'premium' THEN
    RETURN NEW;
  END IF;

  -- BASE limiti: Sadece 'fotoğraflı' anı eklenirken devreye giren kurallar
  IF NEW.photo_url IS NOT NULL THEN
    
    -- 1. Toplam Fotoğraflı Anı Limiti (Max 8)
    SELECT count(*) INTO v_total_photo_memories 
    FROM public.memories 
    WHERE created_by = NEW.created_by AND photo_url IS NOT NULL;
    
    IF v_total_photo_memories >= 8 THEN
      RAISE EXCEPTION 'Upload limit reached';
    END IF;

    -- 2. Günlük Fotoğraf Ekleme Limiti (Max 1) - Hem memory hem place için ortak kontrol
    v_limit_start := public.get_daily_limit_start();

    SELECT count(*) INTO v_today_photo_uploads
    FROM public.photo_upload_events
    WHERE user_id = NEW.created_by
      AND created_at >= v_limit_start;

    IF v_today_photo_uploads >= 1 THEN
      RAISE EXCEPTION 'Upload limit reached';
    END IF;

    INSERT INTO public.photo_upload_events(user_id, source)
    VALUES (NEW.created_by, 'memory');
  END IF;

  -- Fotoğrafsız anıysa direkt kaydet
  RETURN NEW;
END;
$$;

-- Shared Places (Ortak Konumlar) limit kontrolü
CREATE OR REPLACE FUNCTION public.check_place_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_type text;
  v_total_places int;
  v_today_photo_uploads int;
  v_limit_start timestamptz;
BEGIN
  v_user_type := public.get_user_type(NEW.created_by);
  
  -- Premium kullanıcılar için limitleri es geç
  IF v_user_type = 'premium' THEN
    RETURN NEW;
  END IF;

  -- BASE limitleri:
  
  -- 1. Toplam Konum Limiti (Max 8) - Fotoğraflı/fotoğrafsız fark etmeksizin toplam konum limiti
  SELECT count(*) INTO v_total_places 
  FROM public.shared_places 
  WHERE created_by = NEW.created_by;
  
  IF v_total_places >= 8 THEN
    RAISE EXCEPTION 'Place upload limit reached';
  END IF;

  -- 2. Günlük Fotoğraf Ekleme Limiti (Max 1) - Eğer konuma fotoğraf ekleniyorsa kontrol et
  IF NEW.photo_url IS NOT NULL THEN
    v_limit_start := public.get_daily_limit_start();

    SELECT count(*) INTO v_today_photo_uploads
    FROM public.photo_upload_events
    WHERE user_id = NEW.created_by
      AND created_at >= v_limit_start;

    IF v_today_photo_uploads >= 1 THEN
      RAISE EXCEPTION 'Place upload limit reached';
    END IF;

    INSERT INTO public.photo_upload_events(user_id, source)
    VALUES (NEW.created_by, 'place');
  END IF;

  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 4. FRONTEND İÇİN BİLGİ DÖNEN RPC (Helper Function)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Toplam kullanımlar hesaplanır
  SELECT count(*) INTO v_total_photo_memories FROM public.memories WHERE created_by = p_user_id AND photo_url IS NOT NULL;
  SELECT count(*) INTO v_total_places FROM public.shared_places WHERE created_by = p_user_id;
  
  -- Günlük fotoğraf hakkı, upload event kaydından hesaplanır
  SELECT count(*) INTO v_today_photo_uploads
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

-- ==============================================================================
-- 5. TRIGGERLARIN TABLOLARA BAĞLANMASI
-- ==============================================================================
DROP TRIGGER IF EXISTS enforce_memory_limits ON public.memories;
CREATE TRIGGER enforce_memory_limits
BEFORE INSERT ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.check_memory_limits();

DROP TRIGGER IF EXISTS enforce_place_limits ON public.shared_places;
CREATE TRIGGER enforce_place_limits
BEFORE INSERT ON public.shared_places
FOR EACH ROW
EXECUTE FUNCTION public.check_place_limits();
