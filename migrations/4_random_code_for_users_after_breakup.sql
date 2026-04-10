-- ============================================================================
-- Breakup / unlink akisi
-- - missing function: public.genrete_unique_match_code()
-- - unlink_couple RPC: iki tarafi ayir, yeni kod ver, ortak verileri temizle
-- ============================================================================

DROP FUNCTION IF EXISTS public.unlink_couple();
DROP FUNCTION IF EXISTS public.generate_unique_match_code();
DROP FUNCTION IF EXISTS public.genrete_unique_match_code();

CREATE OR REPLACE FUNCTION public.generate_unique_match_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE match_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- typo'lu eski isim ile uyumluluk
CREATE OR REPLACE FUNCTION public.genrete_unique_match_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.generate_unique_match_code();
$$;

CREATE OR REPLACE FUNCTION public.unlink_couple()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_partner_id uuid;
  v_new_code_user text;
  v_new_code_partner text;
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

  v_new_code_user := public.generate_unique_match_code();
  v_new_code_partner := public.generate_unique_match_code();
  WHILE v_new_code_partner = v_new_code_user LOOP
    v_new_code_partner := public.generate_unique_match_code();
  END LOOP;

  UPDATE public.profiles
  SET
    partner_id = NULL,
    matched_at = NULL,
    relationship_start_date = NULL,
    updated_at = now(),
    match_code = CASE
      WHEN id = v_user_id THEN v_new_code_user
      WHEN id = v_partner_id THEN v_new_code_partner
      ELSE match_code
    END
  WHERE id IN (v_user_id, v_partner_id);

  DELETE FROM public.memories
  WHERE created_by IN (v_user_id, v_partner_id)
     OR (user_a_id = LEAST(v_user_id, v_partner_id) AND user_b_id = GREATEST(v_user_id, v_partner_id));

  DELETE FROM public.shared_places
  WHERE created_by IN (v_user_id, v_partner_id)
     OR (user_a_id = LEAST(v_user_id, v_partner_id) AND user_b_id = GREATEST(v_user_id, v_partner_id));

  DELETE FROM public.photo_upload_events
  WHERE user_id IN (v_user_id, v_partner_id);
END;
$$;
