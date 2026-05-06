import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function BecomeHost() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login?redirect=/become-host");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("host_members")
        .select("host_id")
        .eq("user_id", user.id)
        .eq("role", "host")
        .limit(1);
      if (data?.length) navigate(`/hosts/${data[0].host_id}/dashboard`);
    })();
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    let logo_url: string | null = null;
    if (logoFile) {
      const path = `${user.id}/logo-${Date.now()}-${logoFile.name}`;
      const { error: upErr } = await supabase.storage.from("event_assets").upload(path, logoFile);
      if (upErr) {
        setSaving(false);
        return toast({ title: "Logo upload failed", description: upErr.message, variant: "destructive" });
      }
      logo_url = supabase.storage.from("event_assets").getPublicUrl(path).data.publicUrl;
    }
    const { data: host, error } = await supabase
      .from("hosts")
      .insert({ name, bio, contact_email: contactEmail || user.email, logo_url, owner_id: user.id })
      .select("id")
      .single();
    if (error) {
      setSaving(false);
      return toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    const { error: mErr } = await supabase
      .from("host_members")
      .insert({ host_id: host.id, user_id: user.id, role: "host", joined_at: new Date().toISOString() });
    setSaving(false);
    if (mErr) return toast({ title: "Error", description: mErr.message, variant: "destructive" });
    toast({ title: "Welcome, host!" });
    navigate(`/hosts/${host.id}/dashboard`);
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Become a host</CardTitle>
          <CardDescription>Create your organization to start hosting events.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label>Organization name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Logo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1">
              <Label>Short bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </div>
            <div className="space-y-1">
              <Label>Contact email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Creating..." : "Create host"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
