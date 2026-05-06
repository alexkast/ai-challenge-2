# Report

## Tools and Techniques Used
- Lovable Pro — AI-powered code generation and iterative prompting
- Supabase — PostgreSQL database, Auth, Storage, RLS, DB Triggers
- date-fns-tz — timezone-aware date display
- qrcode.react — QR code generation for tickets
- react-helmet-async — OG meta tags for social previews
- Netlify — deployment with SPA routing fix via _redirects

## What Worked
- Detailed first prompt with full schema reduced iterations significantly
- PL/pgSQL DB trigger for FIFO waitlist was atomic and reliable
- Supabase Realtime for live check-in counters worked out of the box
- Lovable correctly generated RLS policies for most tables

## What Did Not Work
- Check-in code lookup had a bug — ticket_code case sensitivity issue
- CSV export initially returned empty rows due to RLS on profiles table
- Gallery upload required manual bucket creation in Supabase Dashboard
- Capacity enforcement bug allowed extra confirmed RSVPs, required manual fix

## Notable Decisions
- FIFO waitlist via DB trigger instead of client-side to prevent race conditions
- profiles table with auth trigger to expose user names/emails safely
- Gallery bucket set to public with RLS on gallery_photos table
  instead of signed URLs — simpler and no expiry bugs
- Session-scoped Undo in check-in to protect against concurrent checker conflicts
- react-helmet-async for OG tags — full prerendering out of scope for challenge

