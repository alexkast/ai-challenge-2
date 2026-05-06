
-- Helper to generate 8-char uppercase alphanumeric ticket codes
CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger 1: promote on cancellation
CREATE OR REPLACE FUNCTION public.promote_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id uuid;
  ev_end timestamptz;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    SELECT end_at INTO ev_end FROM public.events WHERE id = NEW.event_id;
    IF ev_end IS NULL OR ev_end <= now() THEN
      RETURN NEW;
    END IF;

    SELECT id INTO next_id
    FROM public.rsvps
    WHERE event_id = NEW.event_id
      AND status = 'waitlisted'
    ORDER BY waitlist_position ASC NULLS LAST
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF next_id IS NOT NULL THEN
      UPDATE public.rsvps
      SET status = 'confirmed',
          ticket_code = public.generate_ticket_code(),
          promoted_at = now(),
          waitlist_position = NULL
      WHERE id = next_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_on_cancel ON public.rsvps;
CREATE TRIGGER trg_promote_on_cancel
AFTER UPDATE OF status ON public.rsvps
FOR EACH ROW
EXECUTE FUNCTION public.promote_on_cancel();

-- Trigger 2: promote on capacity increase
CREATE OR REPLACE FUNCTION public.promote_on_capacity_increase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slots_opened int;
  r record;
BEGIN
  IF NEW.end_at <= now() THEN
    RETURN NEW;
  END IF;
  IF NEW.capacity IS NULL OR OLD.capacity IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.capacity <= OLD.capacity THEN
    RETURN NEW;
  END IF;

  slots_opened := NEW.capacity - OLD.capacity;

  FOR r IN
    SELECT id FROM public.rsvps
    WHERE event_id = NEW.id AND status = 'waitlisted'
    ORDER BY waitlist_position ASC NULLS LAST
    LIMIT slots_opened
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.rsvps
    SET status = 'confirmed',
        ticket_code = public.generate_ticket_code(),
        promoted_at = now(),
        waitlist_position = NULL
    WHERE id = r.id;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_on_capacity_increase ON public.events;
CREATE TRIGGER trg_promote_on_capacity_increase
AFTER UPDATE OF capacity ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.promote_on_capacity_increase();
