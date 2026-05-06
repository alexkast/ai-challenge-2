import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Props = { eventId: string; canSubmit: boolean };

export function EventFeedback({ eventId, canSubmit }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("id,rating,comment,created_at,user_id")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    let profMap = new Map<string, { full_name: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", userIds);
      profMap = new Map((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name }]));
    }
    setItems(rows.map((r) => ({ ...r, user: profMap.get(r.user_id) ?? null })));
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const mine = useMemo(() => items.find((f) => f.user_id === user?.id), [items, user]);
  const avg = items.length ? items.reduce((s, f) => s + f.rating, 0) / items.length : 0;

  const submit = async () => {
    if (!user || !rating) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      event_id: eventId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Feedback submitted" });
    setRating(0);
    setComment("");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
        <CardDescription>
          {items.length > 0
            ? `${avg.toFixed(1)} ★ · ${items.length} ${items.length === 1 ? "review" : "reviews"}`
            : "No reviews yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canSubmit && !mine && (
          <div className="space-y-2 border rounded p-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      (hover || rating) >= n ? "fill-primary text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              placeholder="Share your experience (optional)"
              rows={3}
            />
            <Button size="sm" onClick={submit} disabled={!rating || submitting}>Submit feedback</Button>
          </div>
        )}
        {mine && (
          <div className="border rounded p-3 bg-muted/30">
            <div className="text-sm font-medium mb-1">Your review</div>
            <div className="text-primary">{"★".repeat(mine.rating)}<span className="text-muted-foreground">{"★".repeat(5 - mine.rating)}</span></div>
            {mine.comment && <p className="text-sm text-muted-foreground mt-1">{mine.comment}</p>}
          </div>
        )}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Be the first to leave feedback.</p>
        ) : (
          <div className="space-y-3">
            {items.map((f) => (
              <div key={f.id} className="border-b last:border-0 pb-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{f.user?.full_name || "Attendee"}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(f.created_at), "yyyy-MM-dd")}</div>
                </div>
                <div className="text-primary text-sm">{"★".repeat(f.rating)}<span className="text-muted-foreground">{"★".repeat(5 - f.rating)}</span></div>
                {f.comment && <p className="text-sm text-muted-foreground mt-1">{f.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
