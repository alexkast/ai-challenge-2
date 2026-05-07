# Event Hosting Platform — Gather

A lightweight event hosting and attendance platform for running
free community-style events end to end.

## Live URL
https://tiny-cat-43667f.netlify.app

## GitHub Repository
https://github.com/alexkast/ai-challenge-2/tree/main/task-2

## Tech Stack
- React + TypeScript + Vite + Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS, DB Triggers)
- Netlify (deployment)

---

## Main Flows

### Flow 1: Publish an Event
1. Register and log in
2. Click profile icon → "Host Dashboard" → first time: "Become a Host"
3. Fill in host name, logo, bio, contact email → Save
4. Click "My Events" → "Create Event"
5. Fill in title, description, dates, timezone, venue or online link,
   capacity, cover image
6. Set Visibility: **Public** (searchable on Explore) or
   **Unlisted** (direct link only)
7. Free/Paid toggle — Paid is disabled with "Coming soon" tooltip
8. Click **Publish** → event appears on Explore page

### Flow 2: RSVP as Attendee
1. Browse events on Explore page (search, date filter, location filter)
2. Toggle "Include past events" to see ended events
3. Click an event → click **Confirm RSVP**
4. If not logged in → redirected to login → returned to event page
5. If capacity available → status = **confirmed** immediately
6. If capacity full → status = **waitlisted** with position shown
7. When a confirmed attendee cancels → next waitlisted user is
   automatically promoted via DB trigger (FIFO, atomic)

### Flow 3: View Your Ticket
1. After RSVP → go to **My Tickets** in navigation
2. See QR code and plain ticket code
3. Click **Download .ics** to add to Apple/Outlook calendar
4. Click **Google Calendar** for direct Google Calendar link
5. If promoted from waitlist → "Promoted from waitlist" badge shown
6. Click **Cancel RSVP** to cancel with confirmation dialog

### Flow 4: Check-in at Venue
1. Host opens Dashboard → finds event → clicks **Check-in link**
2. Enter ticket code manually → click **Check in**
3. Green success shows attendee name and ticket code
4. Live counters: Total RSVPs / Checked In / Remaining
5. Duplicate scan → orange warning "Already checked in" with timestamp
6. Invalid code → red "Invalid code" error
7. **Undo last scan** removes only the current checker's last scan
   (session-scoped, safe for concurrent checkers)

---

## Additional Features

- **Host Dashboard** — upcoming/past events with Going, Waitlist,
  Checked-in stats and CSV export per event
- **Gallery** — attendees upload photos after event ends,
  host approves before public display
- **Feedback** — star rating (1–5) + comment after event ends,
  visible to all attendees
- **Report** — any user can report an event or photo,
  host reviews and hides reported content
- **My Events** — aggregates all events where user has a role
  (Host or Checker) with filters and quick actions
- **Invite Checkers** — host generates a copyable invite link
  for Checker role

---

## Seeded Data

### Host
**Tech Community Vilnius** — community hub for developers
and engineers in Lithuania

### Events
| Title | Type | Status |
|-------|------|--------|
| AI & Web Development Meetup | In-person | Upcoming |
| Kubernetes & GitOps: From Zero to Production | In-person | Upcoming |
| Lightning Talks: What I Learned Shipping AI Features | Online | Upcoming |
| Terraform Workshop: Infrastructure as Code Hands-On | In-person | Upcoming |
| DevOps Vilnius Meetup #12: CI/CD Pipelines in 2024 | In-person | Past |

### Test Accounts
| Role | Email |
|------|-------|
| Host | alexkast@gmail.com |
| Attendee | maria@testmail.com |
| Attendee | jonas@testmail.com |
| Attendee | elena@testmail.com |
| Checker | tomas.checker@testmail.com |

> Password for all test accounts available on request.
> Or register a new account to test the full sign-up flow.

---

## CSV Export Example
See `examples/rsvp-export.csv` for a sample export.

Columns: **Name, Email, RSVP Status, Check-in Time**

Available in Host Dashboard → select event → **Export CSV**
