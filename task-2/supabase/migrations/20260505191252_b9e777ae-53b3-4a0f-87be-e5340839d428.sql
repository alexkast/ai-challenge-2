CREATE OR REPLACE FUNCTION public.enforce_rsvp_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev_capacity int;
  confirmed_count int;
  next_pos int;
BEGIN
  -- Only enforce on new confirmed inserts/updates
  IF NEW.status = 'confirmed' THEN
    SELECT capacity INTO ev_capacity FROM public.events WHERE id = NEW.event_id FOR UPDATE;

    IF ev_capacity IS NOT NULL THEN
      SELECT count(*) INTO confirmed_count
      FROM public.rsvps
      WHERE event_id = NEW.event_id
        AND status = 'confirmed'
        AND (TG_OP = 'INSERT' OR id <> NEW.id);

      IF confirmed_count >= ev_capacity THEN
        SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO next_pos
        FROM public.rsvps
        WHERE event_id = NEW.event_id AND status = 'waitlisted';

        NEW.status := 'waitlisted';
        NEW.waitlist_position := next_pos;
        NEW.ticket_code := NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_rsvp_capacity_trg ON public.rsvps;
CREATE TRIGGER enforce_rsvp_capacity_trg
BEFORE INSERT OR UPDATE OF status ON public.rsvps
FOR EACH ROW
EXECUTE FUNCTION public.enforce_rsvp_capacity();