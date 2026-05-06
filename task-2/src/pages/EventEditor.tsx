import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { TIMEZONES, getBrowserTimezone } from "@/lib/timezones";

export default function EventEditor() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [hosts, setHosts] = useState<any[]>([]);
  const [hostId, setHostId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [tz, setTz] = useState(getBrowserTimezone());
  const [venue, setVenue] = useState("");
  const [online, setOnline] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [visibility, setVisibility] = useState<"public" | "unlisted">("public");
  const [isPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?redirect=/events/new");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: members } = await supabase
        .from("host_members")
        .select("host_id, role, host:hosts(id,name)")
        .eq("user_id", user.id)
        .eq("role", "host");
      const list = (members ?? []).map((m: any) => ({ id: m.host_id, name: m.host?.name }));
      setHosts(list);
      if (!isEdit && list.length) setHostId(list[0].id);
    })();
  }, [user, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (!data) return;
      setHostId(data.host_id);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setStartAt(data.start_at?.slice(0, 16));
      setEndAt(data.end_at?.slice(0, 16));
      setTz(data.timezone || "UTC");
      setVenue(data.venue_address ?? "");
      setOnline(data.online_link ?? "");
      setCapacity(data.capacity?.toString() ?? "");
      setCoverUrl(data.cover_image_url ?? "");
      setStatus(data.status as "draft" | "published");
      setVisibility((data.visibility as "public" | "unlisted") || "public");
    })();
  }, [id, isEdit]);

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile || !user) return coverUrl || null;
    const path = `${user.id}/${Date.now()}-${coverFile.name}`;
    const { error } = await supabase.storage.from("event_assets").upload(path, coverFile);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    return supabase.storage.from("event_assets").getPublicUrl(path).data.publicUrl;
  };

  const save = async (publish: boolean) => {
    if (!hostId) return toast({ title: "Pick a host", variant: "destructive" });
    if (!title || !startAt || !endAt) return toast({ title: "Title, start and end are required", variant: "destructive" });
    setSaving(true);
    const cover = await uploadCover();
    const payload: any = {
      host_id: hostId,
      title,
      description,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      timezone: tz,
      venue_address: venue || null,
      online_link: online || null,
      capacity: capacity ? parseInt(capacity) : null,
      cover_image_url: cover,
      status: publish ? "published" : status === "published" && !publish ? "published" : "draft",
      visibility,
      is_paid: isPaid,
      created_by: user!.id,
    };
    if (publish) payload.status = "published";
    let resId = id;
    if (isEdit && id) {
      const { error } = await supabase.from("events").update(payload).eq("id", id);
      if (error) {
        setSaving(false);
        return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      }
    } else {
      const { data, error } = await supabase.from("events").insert(payload).select("id").single();
      if (error) {
        setSaving(false);
        return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      }
      resId = data.id;
    }
    setSaving(false);
    toast({ title: publish ? "Published" : "Saved as draft" });
    navigate(`/events/${resId}`);
  };

  const unpublish = async () => {
    if (!id) return;
    const { error } = await supabase.from("events").update({ status: "draft" }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setStatus("draft");
    toast({ title: "Unpublished" });
  };

  const duplicate = async () => {
    if (!id) return;
    const { data: src } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (!src) return;
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = src as any;
    const { data, error } = await supabase
      .from("events")
      .insert({ ...rest, title: `${src.title} (copy)`, status: "draft", created_by: user!.id })
      .select("id")
      .single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Duplicated" });
    navigate(`/events/${data.id}/edit`);
  };

  if (!user) return null;
  if (!hosts.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          You need to be a host to create events.{" "}
          <a className="text-primary underline" href="/become-host">
            Become a host
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{isEdit ? "Edit event" : "New event"}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hosts.length > 1 && (
            <div className="space-y-1">
              <Label>Host</Label>
              <Select value={hostId} onValueChange={setHostId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hosts.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End</Label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Timezone</Label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Venue address</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Online link</Label>
            <Input value={online} onChange={(e) => setOnline(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label>Capacity (leave empty for unlimited)</Label>
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Cover image</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
            {coverUrl && !coverFile && (
              <img src={coverUrl} alt="" className="mt-2 max-h-40 rounded" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as "public" | "unlisted")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="vis-public" value="public" />
                <Label htmlFor="vis-public" className="font-normal">Public <span className="text-muted-foreground">— searchable on Explore</span></Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="vis-unlisted" value="unlisted" />
                <Label htmlFor="vis-unlisted" className="font-normal">Unlisted <span className="text-muted-foreground">— direct link only</span></Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Pricing</Label>
            <TooltipProvider>
              <RadioGroup value="free" className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="free" value="free" />
                  <Label htmlFor="free">Free</Label>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 opacity-50">
                      <RadioGroupItem id="paid" value="paid" disabled />
                      <Label htmlFor="paid">Paid</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Paid events coming soon</TooltipContent>
                </Tooltip>
              </RadioGroup>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        {isEdit && status === "published" && (
          <Button variant="outline" onClick={unpublish} disabled={saving}>Unpublish</Button>
        )}
        {isEdit && (
          <Button variant="outline" onClick={duplicate} disabled={saving}>Duplicate</Button>
        )}
        <Button variant="outline" onClick={() => save(false)} disabled={saving}>Save as draft</Button>
        <Button onClick={() => save(true)} disabled={saving}>Publish</Button>
      </div>
    </div>
  );
}
