import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Download, CalendarPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fmtEventTimeWithTz } from "@/lib/eventTime";
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";

export default function MyTickets() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login?redirect=/tickets");
  }, [loading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("rsvps")
      .select(
        "id,status,ticket_code,promoted_at,event:events(id,title,description,start_at,end_at,timezone,venue_address,online_link)"
      )
      .eq("user_id", user.id)
      .eq("status", "confirmed");
    const sorted = (data ?? []).sort(
      (a: any, b: any) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime()
    );
    setTickets(sorted);
  };

  useEffect(() => {
    load();
  }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("rsvps").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "RSVP cancelled" });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My tickets</h1>
        <p className="text-muted-foreground">Your confirmed event RSVPs.</p>
      </div>
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No tickets yet. <Link to="/" className="text-primary underline">Find an event</Link>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tickets.map((t) => {
            const ev = t.event;
            const upcoming = new Date(ev.start_at).getTime() > Date.now();
            return (
              <Card key={t.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      <Link to={`/events/${ev.id}`} className="hover:underline">{ev.title}</Link>
                    </CardTitle>
                    {t.promoted_at && <Badge variant="secondary">Promoted from waitlist</Badge>}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {fmtEventTimeWithTz(ev.start_at, ev.timezone)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ev.venue_address && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {ev.venue_address}
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-2 bg-muted p-4 rounded">
                    <div className="bg-white p-2 rounded">
                      <QRCodeSVG value={t.ticket_code ?? ""} size={200} />
                    </div>
                    <div className="text-xs text-muted-foreground">Ticket code</div>
                    <div className="font-mono font-bold tracking-wider">{t.ticket_code}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadIcs(ev)}>
                      <Download className="h-4 w-4 mr-1" /> Download .ics
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={googleCalendarUrl(ev)} target="_blank" rel="noreferrer">
                        <CalendarPlus className="h-4 w-4 mr-1" /> Google Calendar
                      </a>
                    </Button>
                    {upcoming && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">Cancel RSVP</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel RSVP?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your spot will be released and may be given to someone on the waitlist.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep RSVP</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancel(t.id)}>Cancel RSVP</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
