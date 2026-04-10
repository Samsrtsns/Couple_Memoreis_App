-- ============================================================================
-- Keep anniversary date synced for both partners
-- - When one partner updates relationship_start_date, mirror to the other side.
-- - Prevent recursive ping-pong updates via DISTINCT check.
-- ============================================================================

SET search_path = public;

-- Backfill: align existing couples to a single value if one side is missing.
WITH couples AS (
  SELECT
    p.id AS user_id,
    p.partner_id,
    COALESCE(p.relationship_start_date, pp.relationship_start_date) AS synced_date
  FROM public.profiles p
  JOIN public.profiles pp ON pp.id = p.partner_id
  WHERE p.partner_id IS NOT NULL
    AND p.id < p.partner_id
    AND COALESCE(p.relationship_start_date, pp.relationship_start_date) IS NOT NULL
)
UPDATE public.profiles target
SET
  relationship_start_date = couples.synced_date,
  updated_at = now()
FROM couples
WHERE target.id IN (couples.user_id, couples.partner_id)
  AND target.relationship_start_date IS DISTINCT FROM couples.synced_date;

CREATE OR REPLACE FUNCTION public.sync_relationship_start_date_between_partners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.relationship_start_date IS DISTINCT FROM OLD.relationship_start_date THEN
    UPDATE public.profiles
    SET
      relationship_start_date = NEW.relationship_start_date,
      updated_at = now()
    WHERE id = NEW.partner_id
      AND relationship_start_date IS DISTINCT FROM NEW.relationship_start_date;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_relationship_start_date_between_partners ON public.profiles;
CREATE TRIGGER trg_sync_relationship_start_date_between_partners
AFTER UPDATE OF relationship_start_date
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_relationship_start_date_between_partners();
