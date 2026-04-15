-- ============================================================================
-- İlişki kaldırma (unlink_couple): profil çift alanları NULL, özel günler
-- silinir, anılar / paylaşılan yerler / foto sayaç olayları temizlenir.
-- unpair_partner(): partner yoksa sessiz çıkış; varsa unlink_couple çağırır.
-- ============================================================================

SET search_path = public;

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
    birth_date = NULL,
    relationship_start_date = NULL,
    last_photo_reset = NULL,
    daily_photo_count = public.get_daily_photo_quota(user_type),
    updated_at = now(),
    match_code = CASE
      WHEN id = v_user_id THEN v_new_code_user
      WHEN id = v_partner_id THEN v_new_code_partner
      ELSE match_code
    END
  WHERE id IN (v_user_id, v_partner_id);

  DELETE FROM public.special_days
  WHERE user_a_id = LEAST(v_user_id, v_partner_id)
    AND user_b_id = GREATEST(v_user_id, v_partner_id);

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

CREATE OR REPLACE FUNCTION public.unpair_partner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
BEGIN
  SELECT partner_id INTO v_partner_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_partner_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM public.unlink_couple();
END;
$$;
