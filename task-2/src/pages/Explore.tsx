import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Sparkles } from "lucide-react";
import { fmtEventTime, isPast } from "@/lib/eventTime";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  venue_address: string | null;
  cover_image_url: string | null;
  going?: number;
};

const GRADIENTS = [
  "from-violet-500 via-fuchsia-500 to-pink-500",
  "from-sky-500 via-cyan-500 to-emerald-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-indigo-500 via-blue-500 to-teal-400",
  "from-emerald-500 via-lime-500 to-yellow-400",
  "from-rose-500 via-pink-500 to-purple-500",
];

function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export default function Explore() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [includePast, setIncludePast] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,description,start_at,end_at,timezone,venue_address,cover_image_url")
        .eq("status", "published")
        .eq("visibility", "public")
        .order("start_at", { ascending: true });
      setEvents(data ?? []);
      if (data?.length) {
        const ids = data.map((e) => e.id);
        const { data: rs } = await supabase
          .from("rsvps")
          .select("event_id,status")
          .in("event_id", ids)
          .eq("status", "confirmed");
        const c: Record<string, number> = {};
        (rs ?? []).forEach((r: any) => {
          c[r.event_id] = (c[r.event_id] ?? 0) + 1;
        });
        setCounts(c);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const loc = location.toLowerCase();
    const fromMs = from ? new Date(from).getTime() : null;
    const toMs = to ? new Date(to).getTime() + 86400_000 : null;
    return events.filter((e) => {
      const ended = isPast(e.end_at);
      if (!includePast && ended) return false;
      if (q && !(e.title.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q))) return false;
      if (loc && !(e.venue_address ?? "").toLowerCase().includes(loc)) return false;
      const start = new Date(e.start_at).getTime();
      if (fromMs && start < fromMs) return false;
      if (toMs && start > toMs) return false;
      return true;
    });
  }, [events, search, location, from, to, includePast]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-indigo-600 to-fuchsia-600 px-6 py-14 text-primary-foreground shadow-lg md:px-12 md:py-20">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px),radial-gradient(circle_at_80%_60%,white_1px,transparent_1px)] [background-size:32px_32px,48px_48px]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-white/20 text-primary-foreground hover:bg-white/30 border-white/30 backdrop-blur">
            <Sparkles className="mr-1 h-3 w-3" /> Discover what's on
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Find your next gathering</h1>
          <p className="mt-3 text-lg text-primary-foreground/85 md:text-xl">
            Explore meetups, workshops, and community events happening near you and around the world.
          </p>
        </div>
      </section>

      {/* Filters */}
      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-1">
            <Label>Search</Label>
            <Input placeholder="Title or description" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input placeholder="Venue / city" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 lg:col-span-5">
            <Switch id="past" checked={includePast} onCheckedChange={setIncludePast} />
            <Label htmlFor="past">Include past events</Label>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No events match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const ended = isPast(e.end_at);
            const grad = gradientFor(e.id);
            const dateLabel = fmtEventTime(e.start_at, e.timezone);
            return (
              <Link key={e.id} to={`/events/${e.id}`} className="group">
                <Card className="overflow-hidden h-full border-muted-foreground/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/30">
                  <div className="aspect-video relative overflow-hidden">
                    {e.cover_image_url ? (
                      <img
                        src={e.cover_image_url}
                        alt={e.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
                        <span className="text-4xl font-bold text-white/90 drop-shadow-sm tracking-tight px-6 text-center line-clamp-2">
                          {e.title}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0 shadow-sm backdrop-blur hover:bg-background">
                      <Calendar className="mr-1 h-3 w-3" />
                      {dateLabel}
                    </Badge>
                    {ended && (
                      <Badge variant="secondary" className="absolute top-3 right-3 shadow-sm">
                        Ended
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {e.title}
                    </CardTitle>
                    {e.description && (
                      <CardDescription className="line-clamp-2">{e.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1.5 pb-5">
                    {e.venue_address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{e.venue_address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-foreground">{counts[e.id] ?? 0}</span> going
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
