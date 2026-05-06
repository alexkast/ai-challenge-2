
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- HOSTS
CREATE TABLE public.hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  bio text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;

-- HOST MEMBERS
CREATE TABLE public.host_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('host','checker')),
  invite_token text UNIQUE,
  joined_at timestamptz
);
ALTER TABLE public.host_members ENABLE ROW LEVEL SECURITY;

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  venue_address text,
  online_link text,
  capacity int,
  cover_image_url text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  is_paid boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RSVPS
CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('confirmed','waitlisted','cancelled')),
  ticket_code text UNIQUE,
  waitlist_position int,
  promoted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- CHECKINS
CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rsvp_id uuid NOT NULL UNIQUE REFERENCES public.rsvps(id) ON DELETE CASCADE,
  checked_in_by uuid REFERENCES auth.users(id),
  checked_in_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- GALLERY
CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- FEEDBACK
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- REPORTS
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('event','photo')),
  target_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','hidden','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS (after tables exist)
CREATE OR REPLACE FUNCTION public.is_host_member(_host_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.host_members WHERE host_id = _host_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_host_role(_host_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.host_members WHERE host_id = _host_id AND user_id = _user_id AND role = 'host');
$$;

CREATE OR REPLACE FUNCTION public.event_host_member(_event_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.host_members hm ON hm.host_id = e.host_id
    WHERE e.id = _event_id AND hm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER events_touch_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- POLICIES: hosts
CREATE POLICY "Hosts viewable by everyone" ON public.hosts FOR SELECT USING (true);
CREATE POLICY "Authenticated create host" ON public.hosts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Host members update host" ON public.hosts FOR UPDATE USING (public.is_host_role(id, auth.uid()));

-- POLICIES: host_members
CREATE POLICY "View membership or same host" ON public.host_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_host_member(host_id, auth.uid()));
CREATE POLICY "Hosts insert members" ON public.host_members FOR INSERT
  WITH CHECK (public.is_host_role(host_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.hosts h WHERE h.id = host_id AND h.owner_id = auth.uid()));
CREATE POLICY "Hosts update members or self-accept invite" ON public.host_members FOR UPDATE
  USING (public.is_host_role(host_id, auth.uid())
    OR (user_id IS NULL AND invite_token IS NOT NULL AND auth.uid() IS NOT NULL)
    OR user_id = auth.uid());

-- POLICIES: events
CREATE POLICY "Published events readable" ON public.events FOR SELECT
  USING (status = 'published' OR public.is_host_member(host_id, auth.uid()));
CREATE POLICY "Host members insert events" ON public.events FOR INSERT
  WITH CHECK (public.is_host_member(host_id, auth.uid()));
CREATE POLICY "Host members update events" ON public.events FOR UPDATE
  USING (public.is_host_member(host_id, auth.uid()));
CREATE POLICY "Host members delete events" ON public.events FOR DELETE
  USING (public.is_host_member(host_id, auth.uid()));

-- POLICIES: rsvps
CREATE POLICY "View own or host RSVPs" ON public.rsvps FOR SELECT
  USING (user_id = auth.uid() OR public.event_host_member(event_id, auth.uid()));
CREATE POLICY "RSVP for self" ON public.rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own RSVP" ON public.rsvps FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES: checkins
CREATE POLICY "Host members select checkins" ON public.checkins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.rsvps r WHERE r.id = rsvp_id AND public.event_host_member(r.event_id, auth.uid())));
CREATE POLICY "Host members insert checkins" ON public.checkins FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.rsvps r WHERE r.id = rsvp_id AND public.event_host_member(r.event_id, auth.uid())));
CREATE POLICY "Host members delete checkins" ON public.checkins FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.rsvps r WHERE r.id = rsvp_id AND public.event_host_member(r.event_id, auth.uid())));

-- POLICIES: gallery_photos
CREATE POLICY "Approved photos readable" ON public.gallery_photos FOR SELECT
  USING (status = 'approved' OR public.event_host_member(event_id, auth.uid()) OR uploaded_by = auth.uid());
CREATE POLICY "Confirmed RSVP upload photo" ON public.gallery_photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by
    AND EXISTS (SELECT 1 FROM public.rsvps r WHERE r.event_id = event_id AND r.user_id = auth.uid() AND r.status = 'confirmed'));
CREATE POLICY "Host moderate photos" ON public.gallery_photos FOR UPDATE
  USING (public.event_host_member(event_id, auth.uid()));

-- POLICIES: feedback
CREATE POLICY "Feedback readable for ended events" ON public.feedback FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.end_at <= now()));
CREATE POLICY "Attendees leave feedback after event" ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.end_at <= now())
    AND EXISTS (SELECT 1 FROM public.rsvps r WHERE r.event_id = event_id AND r.user_id = auth.uid()));

-- POLICIES: reports
CREATE POLICY "Authenticated submit reports" ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Host members view reports" ON public.reports FOR SELECT
  USING ((target_type = 'event' AND public.event_host_member(target_id, auth.uid()))
    OR (target_type = 'photo' AND EXISTS (SELECT 1 FROM public.gallery_photos g WHERE g.id = target_id AND public.event_host_member(g.event_id, auth.uid()))));
CREATE POLICY "Host members update reports" ON public.reports FOR UPDATE
  USING ((target_type = 'event' AND public.event_host_member(target_id, auth.uid()))
    OR (target_type = 'photo' AND EXISTS (SELECT 1 FROM public.gallery_photos g WHERE g.id = target_id AND public.event_host_member(g.event_id, auth.uid()))));

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('event_assets', 'event_assets', true),
  ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read event_assets" ON storage.objects FOR SELECT USING (bucket_id = 'event_assets');
CREATE POLICY "Auth upload event_assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event_assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth update own event_assets" ON storage.objects FOR UPDATE
  USING (bucket_id = 'event_assets' AND auth.uid() = owner);

CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Auth upload gallery" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth update own gallery" ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery' AND auth.uid() = owner);
