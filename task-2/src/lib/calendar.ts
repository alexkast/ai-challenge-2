import { formatInTimeZone } from "date-fns-tz";

type EventLike = {
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  venue_address?: string | null;
  online_link?: string | null;
};

const escapeIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const fmtLocal = (iso: string, tz: string) =>
  formatInTimeZone(new Date(iso), tz, "yyyyMMdd'T'HHmmss");

const fmtUtc = (iso: string) =>
  formatInTimeZone(new Date(iso), "UTC", "yyyyMMdd'T'HHmmss'Z'");

export function buildIcs(ev: EventLike): string {
  const uid = `${ev.start_at}-${ev.title}`.replace(/\s+/g, "") + "@lovable";
  const desc = (ev.description || "").slice(0, 500);
  const loc = ev.venue_address || ev.online_link || "";
  const dtStart = fmtLocal(ev.start_at, ev.timezone);
  const dtEnd = fmtLocal(ev.end_at, ev.timezone);
  const dtStamp = fmtUtc(new Date().toISOString());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lovable//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    `TZID:${ev.timezone}`,
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${ev.timezone}:${dtStart}`,
    `DTEND;TZID=${ev.timezone}:${dtEnd}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    `DESCRIPTION:${escapeIcs(desc)}`,
    `LOCATION:${escapeIcs(loc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(ev: EventLike) {
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^\w-]+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(ev: EventLike): string {
  const desc = (ev.description || "").slice(0, 500);
  const loc = ev.venue_address || ev.online_link || "";
  const dates = `${fmtUtc(ev.start_at)}/${fmtUtc(ev.end_at)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates,
    details: desc,
    location: loc,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
