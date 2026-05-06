import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Plus, Download, Link as LinkIcon } from "lucide-react";
import { fmtEventTime, isPast } from "@/lib/eventTime";
import { format } from "date-fns";

export default function HostDashboard() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [host, setHost] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, { going: number; waitlist: number; checkedIn: number }>>({});
  const [members, setMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate(`/login?redirect=/hosts/${id}/dashboard`);
  }, [loading, user, id, navigate]);

  const loadAll = async () => {
    if (!user || !id) return;
    const { data: m } = await supabase
      .from("host_members")
      .select("role")
      .eq("host_id", id)
      .eq("user_id", user.id)
      .eq("role", "host")
      .maybeSingle();
    if (!m) return setAllowed(false);
    setAllowed(true);

    const { data: h } = await supabase.from("hosts").select("*").eq("id", id).maybeSingle();
    setHost(h);

    const { data: ev } = await supabase
      .from("events")
      .select("id,title,start_at,end_at,timezone,status")
      .eq("host_id", id)
      .order("start_at", { ascending: false });
    setEvents(ev ?? []);

    const evIds = (ev ?? []).map((e) => e.id);
    if (evIds.length) {
      const { data: rs } = await supabase
        .from("rsvps")
        .select("id,event_id,status")
        .in("event_id", evIds);
      const rsvpIds = (rs ?? []).map((r: any) => r.id);
      const { data: ck } = rsvpIds.length
        ? await supabase.from("checkins").select("rsvp_id").in("rsvp_id", rsvpIds)
        : { data: [] as any[] };
      const ckSet = new Set((ck ?? []).map((c: any) => c.rsvp_id));
      const s: typeof stats = {};
      (ev ?? []).forEach((e) => (s[e.id] = { going: 0, waitlist: 0, checkedIn: 0 }));
      (rs ?? []).forEach((r: any) => {
        if (r.status === "confirmed") s[r.event_id].going++;
        if (r.status === "waitlisted") s[r.event_id].waitlist++;
        if (ckSet.has(r.id)) s[r.event_id].checkedIn++;
      });
      setStats(s);
    }

    const { data: mems } = await supabase
      .from("host_members")
      .select("id,role,user_id,invite_token,joined_at,profile:profiles(full_name,email)")
      .eq("host_id", id);
    setMembers(mems ?? []);

    if (evIds.length) {
      const { data: photos } = await supabase
        .from("gallery_photos")
        .select("id")
        .in("event_id", evIds);
      const photoIds = (photos ?? []).map((p) => p.id);
      const targetIds = [...evIds, ...photoIds];
      const { data: rep, error: repErr } = await supabase
        .from("reports")
        .select("*")
        .in("target_id", targetIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (repErr) console.error("Reports load error", repErr);
      const reporterIds = Array.from(new Set((rep ?? []).map((r: any) => r.reporter_id).filter(Boolean)));
      const { data: reporters } = reporterIds.length
        ? await supabase.from("profiles").select("id,full_name,email").in("id", reporterIds)
        : { data: [] as any[] };
      const repMap = new Map((reporters ?? []).map((p: any) => [p.id, p]));
      setReports((rep ?? []).map((r: any) => ({ ...r, reporter: repMap.get(r.reporter_id) })));
    } else {
      setReports([]);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user, id]);

  const upcoming = events.filter((e) => !isPast(e.end_at));
  const past = events.filter((e) => isPast(e.end_at));

  const createInvite = async () => {
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from("host_members")
      .insert({ host_id: id, role: "checker", invite_token: token, user_id: null });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Invite link copied", description: url });
    loadAll();
  };

  const copyCheckin = async (eid: string) => {
    const url = `${window.location.origin}/events/${eid}/checkin`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Check-in link copied" });
  };

  const exportCsv = async (ev: any) => {
    const { data: rs } = await supabase
      .from("rsvps")
      .select("id,status,user_id")
      .eq("event_id", ev.id);
    const rsvps = rs ?? [];
    const rsvpIds = rsvps.map((r: any) => r.id);
    const userIds = Array.from(new Set(rsvps.map((r: any) => r.user_id).filter(Boolean)));

    const [{ data: profs }, { data: ck }] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id,full_name,email").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      rsvpIds.length
        ? supabase.from("checkins").select("rsvp_id,checked_in_at").in("rsvp_id", rsvpIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const ckMap = new Map((ck ?? []).map((c: any) => [c.rsvp_id, c.checked_in_at]));

    const esc = (v: string) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [["Name", "Email", "RSVP Status", "Check-in Time"]];
    rsvps.forEach((r: any) => {
      const at = ckMap.get(r.id);
      const p: any = profMap.get(r.user_id);
      rows.push([
        p?.full_name || "",
        p?.email || "",
        r.status,
        at ? format(new Date(at), "yyyy-MM-dd HH:mm") : "",
      ]);
    });
    const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ev.title.replace(/[^\w-]+/g, "_")}-rsvps.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleReport = async (r: any, action: "hidden" | "dismissed") => {
    const { error } = await supabase.from("reports").update({ status: action }).eq("id", r.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    if (action === "hidden") {
      if (r.target_type === "event") {
        await supabase.from("events").update({ status: "draft" }).eq("id", r.target_id);
      } else if (r.target_type === "photo") {
        await supabase.from("gallery_photos").update({ status: "rejected" }).eq("id", r.target_id);
      }
    }
    setReports((rs) => rs.filter((x) => x.id !== r.id));
    toast({ title: action === "hidden" ? "Hidden" : "Dismissed" });
  };

  if (allowed === false) return <div className="text-center py-16">You are not a host of this organization.</div>;
  if (!allowed || !host) return <p className="text-muted-foreground">Loading...</p>;

  const renderEvent = (e: any) => {
    const s = stats[e.id] ?? { going: 0, waitlist: 0, checkedIn: 0 };
    return (
      <Card key={e.id}>
        <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-[180px]">
            <Link to={`/events/${e.id}`} className="font-medium hover:underline">{e.title}</Link>
            <div className="text-xs text-muted-foreground">
              {fmtEventTime(e.start_at, e.timezone)} · <Badge variant="outline" className="text-[10px]">{e.status}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>Going <b>{s.going}</b></span>
            <span>Waitlist <b>{s.waitlist}</b></span>
            <span>Checked in <b>{s.checkedIn}</b></span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to={`/events/${e.id}/edit`}>Edit</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to={`/events/${e.id}`}>View</Link></Button>
            <Button size="sm" variant="outline" onClick={() => copyCheckin(e.id)}>
              <LinkIcon className="h-4 w-4 mr-1" /> Check-in link
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportCsv(e)}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{host.name}</h1>
          <p className="text-muted-foreground text-sm">Host dashboard</p>
        </div>
        <Button asChild><Link to="/events/new"><Plus className="h-4 w-4 mr-1" /> New event</Link></Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events.</p> : upcoming.map(renderEvent)}
        </TabsContent>

        <TabsContent value="past" className="space-y-3 mt-4">
          {past.length === 0 ? <p className="text-muted-foreground">No past events.</p> : past.map(renderEvent)}
        </TabsContent>

        <TabsContent value="team" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={createInvite}>
              <Copy className="h-4 w-4 mr-1" /> Invite checker
            </Button>
          </div>
          {members.map((m) => {
            const pending = !m.user_id && m.invite_token;
            const inviteUrl = pending ? `${window.location.origin}/invite/${m.invite_token}` : null;
            return (
              <Card key={m.id}>
                <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {m.profile?.full_name || m.profile?.email || (pending ? "Pending invite" : "Member")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.profile?.email}
                      {m.joined_at && ` · joined ${format(new Date(m.joined_at), "yyyy-MM-dd")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{m.role}</Badge>
                    {pending && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await navigator.clipboard.writeText(inviteUrl!);
                          toast({ title: "Invite link copied" });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copy link
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="reports" className="space-y-3 mt-4">
          {reports.length === 0 ? (
            <p className="text-muted-foreground">No pending reports.</p>
          ) : (
            reports.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base capitalize">{r.target_type} report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{r.reason || "No reason provided."}</p>
                  <div className="text-xs text-muted-foreground">
                    Reported by {r.reporter?.full_name || r.reporter?.email || "anonymous"} ·{" "}
                    {format(new Date(r.created_at), "yyyy-MM-dd HH:mm")}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="destructive" onClick={() => handleReport(r, "hidden")}>Hide</Button>
                    <Button size="sm" variant="outline" onClick={() => handleReport(r, "dismissed")}>Dismiss</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
