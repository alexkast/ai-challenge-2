import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CheckCircle2, AlertTriangle, XCircle, Undo2 } from "lucide-react";

type Result =
  | { kind: "success"; name: string; code: string }
  | { kind: "already"; name: string; code: string; at: string }
  | { kind: "invalid" }
  | { kind: "not_confirmed"; status: string }
  | null;

type HistoryRow = { id: string; name: string; code: string; at: string };

export default function CheckIn() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [code, setCode] = useState("");
  const [counts, setCounts] = useState({ total: 0, checked: 0 });
  const [result, setResult] = useState<Result>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [lastCheckinId, setLastCheckinId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate(`/login?redirect=/events/${id}/checkin`);
  }, [loading, user, id, navigate]);

  const refreshCounts = async () => {
    if (!id) return;
    const { data: rs } = await supabase
      .from("rsvps")
      .select("id")
      .eq("event_id", id)
      .eq("status", "confirmed");
    const ids = (rs ?? []).map((r) => r.id);
    const { data: ck } = ids.length
      ? await supabase.from("checkins").select("rsvp_id").in("rsvp_id", ids)
      : { data: [] as any[] };
    setCounts({ total: ids.length, checked: ck?.length ?? 0 });
  };

  const refreshHistory = async () => {
    if (!id) return;
    const { data: rs } = await supabase
      .from("rsvps")
      .select("id,ticket_code,user_id")
      .eq("event_id", id);
    const rsvps = rs ?? [];
    if (!rsvps.length) return setHistory([]);
    const rsvpMap = new Map(rsvps.map((r: any) => [r.id, r]));
    const { data: ck, error } = await supabase
      .from("checkins")
      .select("id,checked_in_at,rsvp_id")
      .in("rsvp_id", rsvps.map((r: any) => r.id))
      .order("checked_in_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("History fetch error", error);
      return;
    }
    const userIds = Array.from(new Set((ck ?? []).map((c: any) => rsvpMap.get(c.rsvp_id)?.user_id).filter(Boolean)));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("id,full_name").in("id", userIds)
      : { data: [] as any[] };
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
    setHistory(
      (ck ?? []).map((c: any) => {
        const r = rsvpMap.get(c.rsvp_id);
        return {
          id: c.id,
          name: profMap.get(r?.user_id) || "Unknown",
          code: r?.ticket_code || "",
          at: c.checked_in_at,
        };
      })
    );
  };

  const init = async () => {
    if (!user || !id) return;
    const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (!ev) return setAllowed(false);
    setEvent(ev);
    const { data: m } = await supabase
      .from("host_members")
      .select("role")
      .eq("host_id", ev.host_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!m || (m.role !== "host" && m.role !== "checker")) return setAllowed(false);
    setAllowed(true);
    await Promise.all([refreshCounts(), refreshHistory()]);
  };

  useEffect(() => {
    init();
  }, [user, id]);

  useEffect(() => {
    if (allowed) inputRef.current?.focus();
  }, [allowed]);

  // Realtime subscription
  useEffect(() => {
    if (!allowed || !id) return;
    const channel = supabase
      .channel(`checkins-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins" }, () => {
        refreshCounts();
        refreshHistory();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [allowed, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    setCode("");
    if (!c) {
      inputRef.current?.focus();
      return;
    }
    const { data: rs, error: rsErr } = await supabase
      .from("rsvps")
      .select("id,status,user_id")
      .eq("event_id", id)
      .eq("ticket_code", c)
      .maybeSingle();

    if (rsErr) console.error("RSVP lookup error", rsErr);

    if (!rs) {
      setResult({ kind: "invalid" });
    } else if (rs.status !== "confirmed") {
      setResult({ kind: "not_confirmed", status: rs.status });
    } else {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", rs.user_id)
        .maybeSingle();
      const { data: existing } = await supabase
        .from("checkins")
        .select("id,checked_in_at")
        .eq("rsvp_id", rs.id)
        .maybeSingle();
      const name = prof?.full_name || "Attendee";
      if (existing) {
        setResult({ kind: "already", name, code: c, at: existing.checked_in_at });
      } else {
        const { data: ins, error } = await supabase
          .from("checkins")
          .insert({ rsvp_id: rs.id, checked_in_by: user!.id })
          .select("id")
          .single();
        if (error) {
          setResult({ kind: "invalid" });
        } else {
          setLastCheckinId(ins.id);
          setResult({ kind: "success", name, code: c });
        }
      }
    }
    await Promise.all([refreshCounts(), refreshHistory()]);
    inputRef.current?.focus();
  };

  const undoLast = async () => {
    if (!lastCheckinId) return;
    const { error } = await supabase.from("checkins").delete().eq("id", lastCheckinId);
    if (!error) {
      setLastCheckinId(null);
      setResult(null);
      await Promise.all([refreshCounts(), refreshHistory()]);
    }
    inputRef.current?.focus();
  };

  if (allowed === false) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-2">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-muted-foreground">You don't have permission to check in attendees for this event.</p>
      </div>
    );
  }
  if (allowed === null) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{event?.title}</h1>
        <p className="text-muted-foreground text-sm">Check-in</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">Total RSVPs</div><div className="text-2xl font-bold">{counts.total}</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">Checked in</div><div className="text-2xl font-bold">{counts.checked}</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">Remaining</div><div className="text-2xl font-bold">{Math.max(0, counts.total - counts.checked)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Scan ticket code</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={submit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TICKET CODE"
              autoFocus
              className="text-lg font-mono tracking-widest h-12"
            />
            <Button type="submit" size="lg">Check in</Button>
          </form>

          {result?.kind === "success" && (
            <div className="rounded-md border border-green-300 bg-green-50 text-green-900 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 mt-0.5" />
              <div>
                <div className="font-semibold">Checked in: {result.name}</div>
                <div className="text-sm font-mono">{result.code}</div>
              </div>
            </div>
          )}
          {result?.kind === "already" && (
            <div className="rounded-md border border-orange-300 bg-orange-50 text-orange-900 p-4 flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 mt-0.5" />
              <div>
                <div className="font-semibold">Already checked in</div>
                <div className="text-sm">{result.name} at {new Date(result.at).toLocaleTimeString()}</div>
              </div>
            </div>
          )}
          {result?.kind === "invalid" && (
            <div className="rounded-md border border-red-300 bg-red-50 text-red-900 p-4 flex items-center gap-3">
              <XCircle className="h-6 w-6" /> <div className="font-semibold">Invalid code</div>
            </div>
          )}
          {result?.kind === "not_confirmed" && (
            <div className="rounded-md border border-red-300 bg-red-50 text-red-900 p-4 flex items-center gap-3">
              <XCircle className="h-6 w-6" />
              <div className="font-semibold">Ticket not confirmed ({result.status})</div>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!lastCheckinId}>
                <Undo2 className="h-4 w-4 mr-1" /> Undo last scan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Undo last check-in?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your most recent check-in from this session.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={undoLast}>Undo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent check-ins</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No check-ins yet.</p>
          ) : (
            <ul className="divide-y">
              {history.map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{h.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{h.code}</div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(h.at).toLocaleTimeString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
