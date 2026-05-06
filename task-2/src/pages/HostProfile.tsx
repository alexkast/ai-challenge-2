import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Mail } from "lucide-react";
import { fmtEventTime } from "@/lib/eventTime";
import { Seo } from "@/components/Seo";

export default function HostProfile() {
  const { id } = useParams();
  const [host, setHost] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("hosts").select("*").eq("id", id).maybeSingle();
      if (!data) {
        setNotFound(true);
        return;
      }
      setHost(data);
      const { data: ev } = await supabase
        .from("events")
        .select("id,title,start_at,timezone,venue_address,cover_image_url")
        .eq("host_id", id)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("start_at", { ascending: true });
      setEvents(ev ?? []);
    })();
  }, [id]);

  if (notFound) return <div className="text-center py-16">Host not found.</div>;
  if (!host) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Seo title={host.name} description={host.bio || ""} image={host.logo_url || undefined} />
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={host.logo_url} />
          <AvatarFallback>{host.name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{host.name}</h1>
          {host.contact_email && (
            <a href={`mailto:${host.contact_email}`} className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-primary">
              <Mail className="h-4 w-4" /> {host.contact_email}
            </a>
          )}
        </div>
      </div>
      {host.bio && <p className="text-muted-foreground whitespace-pre-wrap">{host.bio}</p>}
      <h2 className="text-xl font-semibold">Upcoming events</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground">No published events.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {fmtEventTime(e.start_at, e.timezone)}
                  </CardDescription>
                </CardHeader>
                {e.venue_address && (
                  <CardContent className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {e.venue_address}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
