import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Link as LinkIcon, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fmtEventTimeWithTz, isPast } from "@/lib/eventTime";
import { Seo } from "@/components/Seo";
import { ReportButton } from "@/components/ReportButton";
import { EventGallery } from "@/components/EventGallery";
import { EventFeedback } from "@/components/EventFeedback";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [rsvp, setRsvp] = useState<any>(null);
  const [counts, setCounts] = useState({ going: 0, waitlist: 0 });
  const [submitting, setSubmitting] = useState(false);

  const genTicket = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let s = "";
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  const [isHostMember, setIsHostMember] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      setNotFound(true);
      return;
    }
    setEvent(data);
    const { data: rs } = await supabase
      .from("rsvps")
      .select("id,status,user_id,ticket_code,waitlist_position,promoted_at")
      .eq("event_id", id);
    const all = rs ?? [];
    setCounts({
      going: all.filter((r) => r.status === "confirmed").length,
      waitlist: all.filter((r) => r.status === "waitlisted").length,
    });
    if (user) {
      setRsvp(all.find((r: any) => r.user_id === user.id && r.status !== "cancelled") ?? null);
    }
    if (user && data.host_id) {
      const { data: m } = await supabase
        .from("host_members")
        .select("role")
        .eq("host_id", data.host_id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsHostMember(!!m);
    } else {
      setIsHostMember(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, user]);

  const handleRsvp = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (submitting) return;
    if (rsvp && rsvp.status !== "cancelled") {
      toast({ title: "You already have an RSVP" });
      return;
    }
    setSubmitting(true);
    try {
      const hasCapacity = event.capacity != null;
      const isFull = hasCapacity && counts.going >= event.capacity;
      let payload: any = { event_id: id, user_id: user.id };
      if (isFull) {
        const { data: maxRow } = await supabase
          .from("rsvps")
          .select("waitlist_position")
          .eq("event_id", id)
          .eq("status", "waitlisted")
          .order("waitlist_position", { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextPos = (maxRow?.waitlist_position ?? 0) + 1;
        payload = { ...payload, status: "waitlisted", waitlist_position: nextPos };
      } else {
        payload = { ...payload, status: "confirmed", ticket_code: genTicket() };
      }
      const { error } = await supabase.from("rsvps").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({
        title: isFull ? `You're on the waitlist (position ${payload.waitlist_position})` : "RSVP confirmed!",
        description: isFull ? undefined : `Ticket: ${payload.ticket_code}`,
      });
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRsvp = async () => {
    if (!rsvp) return;
    const { error } = await supabase
      .from("rsvps")
      .update({ status: "cancelled" })
      .eq("id", rsvp.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "RSVP cancelled" });
    await load();
  };

  if (notFound) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h1 className="text-3xl font-bold">Event not found</h1>
        <p className="text-muted-foreground">This event may have been removed or the link is incorrect.</p>
        <Button asChild>
          <Link to="/">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  if (!event) return <p className="text-muted-foreground">Loading...</p>;

  const ended = isPast(event.end_at);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Seo
        title={event.title}
        description={event.description || ""}
        image={event.cover_image_url || undefined}
        type="article"
      />
      {event.cover_image_url && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      {ended && (
        <Card className="border-muted">
          <CardContent className="py-3 text-center font-medium">This event has ended.</CardContent>
        </Card>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="text-muted-foreground space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {fmtEventTimeWithTz(event.start_at, event.timezone)}
              {" → "}
              {fmtEventTimeWithTz(event.end_at, event.timezone)}
            </div>
            {event.venue_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {event.venue_address}
              </div>
            )}
            {event.online_link && (
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <a href={event.online_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Join online
                </a>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {counts.going} going
              </span>
              {counts.waitlist > 0 && <span>{counts.waitlist} on waitlist</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ended && <Badge variant="secondary">Ended</Badge>}
          <ReportButton targetType="event" targetId={event.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">
          {event.description || "No description."}
        </CardContent>
      </Card>

      {!ended && (
        <Card>
          <CardHeader>
            <CardTitle>
              {rsvp?.status === "confirmed"
                ? "You're going"
                : rsvp?.status === "waitlisted"
                ? "You're on the waitlist"
                : "RSVP"}
            </CardTitle>
            <CardDescription>
              {!rsvp && "Reserve your spot for this event."}
              {rsvp?.status === "waitlisted" && `Position ${rsvp.waitlist_position}`}
              {rsvp?.status === "confirmed" && rsvp.promoted_at && "Promoted from waitlist"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!rsvp && (
              <Button onClick={handleRsvp} disabled={submitting}>
                {event.capacity != null && counts.going >= event.capacity ? "Join waitlist" : "Confirm RSVP"}
              </Button>
            )}
            {rsvp?.ticket_code && (
              <div className="font-mono text-sm bg-muted p-3 rounded">Ticket: {rsvp.ticket_code}</div>
            )}
            {rsvp && new Date(event.start_at).getTime() > Date.now() && (
              <Button variant="outline" size="sm" onClick={cancelRsvp}>
                Cancel RSVP
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {ended && (
        <>
          <EventGallery
            eventId={event.id}
            hasConfirmedRsvp={rsvp?.status === "confirmed"}
            isHostMember={isHostMember}
          />
          <EventFeedback eventId={event.id} canSubmit={rsvp?.status === "confirmed"} />
        </>
      )}
    </div>
  );
}
