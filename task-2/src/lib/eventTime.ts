import { formatInTimeZone } from "date-fns-tz";

export function fmtEventTime(iso: string, tz: string, fmt = "PPp") {
  return formatInTimeZone(new Date(iso), tz || "UTC", fmt);
}

export function fmtEventDate(iso: string, tz: string) {
  return formatInTimeZone(new Date(iso), tz || "UTC", "PPP");
}

export function fmtEventTimeWithTz(iso: string, tz: string) {
  return formatInTimeZone(new Date(iso), tz || "UTC", "PPp (zzz)");
}

export function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}
