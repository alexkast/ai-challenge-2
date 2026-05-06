
ALTER TABLE public.feedback
ADD CONSTRAINT feedback_event_user_unique UNIQUE (event_id, user_id);

CREATE POLICY "Authenticated users upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');
