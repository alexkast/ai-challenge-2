# Event Hosting Platform

## Live URL
https://your-app.netlify.app

## Main Flows

### Flow 1: Publish an Event
1. Register and log in
2. Click profile icon → "Become a Host" → fill in name, logo, bio, email
3. Click "My Events" → "Create Event"
4. Fill in title, description, dates, timezone, venue, capacity
5. Set Visibility: Public or Unlisted
6. Click "Publish" — event appears on Explore page

### Flow 2: RSVP as Attendee
1. Browse events on Explore page
2. Click an event → click "RSVP"
3. If not logged in — redirected to login, then back to event
4. If capacity available → confirmed immediately
5. If capacity full → added to waitlist (FIFO, auto-promoted on cancellation)

### Flow 3: View Your Ticket
1. After RSVP → go to "My Tickets"
2. See QR code and ticket code
3. Click "Download .ics" or "Google Calendar" to add to calendar
4. If promoted from waitlist → "Promoted from waitlist" badge shown

### Flow 4: Check-in at Venue
1. Host opens Dashboard → finds event → clicks "Check-in link"
2. Enter ticket code manually → click "Check in"
3. Green success shows attendee name, counters update live
4. Duplicate scan shows orange warning with timestamp
5. "Undo last scan" removes the most recent check-in from current session

## Seeded Data
- Host: Tech Community Vilnius
- Upcoming event: AI & Web Development Meetup
- Past event: DevOps Vilnius Meetup #12: CI/CD Pipelines in 2024

