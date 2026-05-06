# Report

## Tools and Techniques Used
- Lovable Pro — AI-powered code generation and iterative prompting
- Supabase — PostgreSQL database, Auth, Storage, RLS, DB Triggers
- date-fns-tz — timezone-aware date display
- qrcode.react — QR code generation for tickets
- react-helmet-async — OG meta tags for social previews
- Netlify — deployment with SPA routing fix via public/_redirects

## What Worked
- Detailed first prompt with full data schema reduced iterations significantly
- PL/pgSQL DB trigger for FIFO waitlist promotion was atomic and reliable,
  preventing race conditions that client-side logic would have introduced
- Supabase Realtime for live check-in counters worked out of the box
- Lovable correctly generated RLS policies for most tables on first attempt
- Waitlist auto-promotion via DB trigger worked correctly end-to-end:
  cancelling a confirmed RSVP automatically promoted the next waitlisted
  user with a new ticket code and "Promoted from waitlist" badge
- QR code generation, .ics download and Google Calendar integration
  worked without additional fixes

## What Did Not Work
- Visibility field (Public/Unlisted) was missing from event creation form
  and had to be added via a follow-up prompt
- Check-in page returned "Invalid code" for valid tickets on first attempt,
  required a fix to the lookup query
- CSV export initially returned empty rows due to RLS restricting host
  access to profiles table — required explicit policy fix
- Capacity enforcement bug allowed more confirmed RSVPs than capacity limit,
  required manual cleanup of rsvps table and a prompt fix
- Report flow: submitted reports were not appearing in Host Dashboard,
  required a fix to the join query filtering by host_id
- Gallery: uploading user could not see their own pending photo,
  required a follow-up fix to show pending photos to the uploader
- Europe/Vilnius timezone was missing from the dropdown and had to be
  added manually via a prompt

## Notable Decisions
- FIFO waitlist implemented via PL/pgSQL DB trigger with FOR UPDATE SKIP LOCKED
  instead of client-side logic to guarantee atomicity and prevent race conditions
- Two separate triggers: one on rsvps (cancellation) and one on events
  (capacity increase) to cover all promotion scenarios
- profiles table with auth.users trigger to safely expose user names and emails
  for CSV export and check-in display, since auth.users is not accessible
  via the client API
- Gallery bucket set to public with RLS enforced on gallery_photos table
  instead of signed URLs — avoids URL expiry bugs and simplifies implementation
- Session-scoped Undo in check-in tracks last check-in ID in React state,
  preventing a checker from accidentally undoing another checker's scan
- react-helmet-async used for OG meta tags — full SSR prerendering was
  considered but deemed out of scope for this challenge
- SPA routing fix via public/_redirects to prevent 404 errors on direct
  URL access after Netlify deployment
