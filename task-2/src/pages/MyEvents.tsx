import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { fmtEventTime } from "@/lib/eventTime";

export default function MyEvents() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [hostFilter, setHostFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login?redirect=/my-events");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: m } = await supabase
        .from("host_members")
        .select("host_id, role, host:hosts(id,name)")
        .eq("user_id", user.id);
      setMembers(m ?? []);
      const ids = (m ?? []).map((x: any) => x.host_id);
      if (ids.length) {
        const { data: ev } = await supabase
          .from("events")
          .select("id,title,start_at,timezone,status,host_id,host:hosts(name)")
          .in("host_id", ids)
          .order("start_at", { ascending: false });
        setEvents(ev ?? []);
      }
    })();
  }, [user]);

  const roleByHost = useMemo(() => {
    const r: Record<string, string> = {};
    members.forEach((m: any) => (r[m.host_id] = m.role));
    return r;
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const fromMs = from ? new Date(from).getTime() : null;
    const toMs = to ? new Date(to).getTime() + 86400_000 : null;
    return events.filter((e) => {
      if (hostFilter !== "all" && e.host_id !== hostFilter) return false;
      if (q && !e.title.toLowerCase().includes(q)) return false;
      const t = new Date(e.start_at).getTime();
      if (fromMs && t < fromMs) return false;
      if (toMs && t > toMs) return false;
      return true;
    });
  }, [events, hostFilter, search, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">My events</h1>
          <p className="text-muted-foreground">Events from hosts you belong to.</p>
        </div>
        {members.some((m: any) => m.role === "host") && (
          <Button asChild><Link to="/events/new"><Plus className="h-4 w-4 mr-1" /> New event</Link></Button>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Search</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Host</Label>
            <Select value={hostFilter} onValueChange={setHostFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hosts</SelectItem>
                {members.map((m: any) => (
                  <SelectItem key={m.host_id} value={m.host_id}>{m.host?.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No events.</CardContent></Card>
      ) : (
        filtered.map((e) => {
          const role = roleByHost[e.host_id];
          return (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link to={`/events/${e.id}`} className="hover:underline">{e.title}</Link>
                    <Badge variant="outline" className="ml-2 text-[10px]">{e.status}</Badge>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {role === "host" && (
                      <>
                        <Button asChild size="sm" variant="outline"><Link to={`/events/${e.id}/edit`}>Edit</Link></Button>
                        <Button asChild size="sm" variant="outline"><Link to={`/hosts/${e.host_id}/dashboard`}>Dashboard</Link></Button>
                        <Button asChild size="sm"><Link to={`/events/${e.id}/checkin`}>Check-in</Link></Button>
                      </>
                    )}
                    {role === "checker" && (
                      <Button asChild size="sm"><Link to={`/events/${e.id}/checkin`}>Check-in</Link></Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                <span>{fmtEventTime(e.start_at, e.timezone)}</span>
                <span>
                  {e.host?.name && <span>by {e.host.name} · </span>}
                  <Badge variant="outline" className="text-[10px] capitalize">{role}</Badge>
                </span>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
