import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

type Props = {
  targetType: "event" | "photo";
  targetId: string;
  size?: "sm" | "icon";
  label?: string;
};

export function ReportButton({ targetType, targetId, size = "sm", label = "Report" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!user) {
      setReported(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("reports")
        .select("id")
        .eq("reporter_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .limit(1)
        .maybeSingle();
      if (!cancelled) setReported(!!data);
    })();
    return () => { cancelled = true; };
  }, [user, targetType, targetId]);

  const submit = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Report submitted" });
    setReason("");
    setOpen(false);
    setReported(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (next && reported) {
      toast({ title: "Already reported", description: "You've already reported this." });
      return;
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {size === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={reported ? "Reported" : "Report"}
            className={reported ? "text-destructive" : undefined}
          >
            <Flag className={`h-4 w-4 ${reported ? "fill-current" : ""}`} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={reported ? "text-destructive" : undefined}
          >
            <Flag className={`h-4 w-4 mr-1 ${reported ? "fill-current" : ""}`} />
            {reported ? "Reported" : label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>Tell us what's wrong. Hosts will review.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          placeholder="Reason (optional)"
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
