import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ReportButton } from "@/components/ReportButton";

type Props = {
  eventId: string;
  hasConfirmedRsvp: boolean;
  isHostMember: boolean;
};

export function EventGallery({ eventId, hasConfirmedRsvp, isHostMember }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    let q = supabase
      .from("gallery_photos")
      .select("id,photo_url,status,uploaded_by")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (!isHostMember) {
      if (user) {
        q = q.or(`status.eq.approved,uploaded_by.eq.${user.id}`);
      } else {
        q = q.eq("status", "approved");
      }
    }
    const { data } = await q;
    setPhotos(data ?? []);
  };

  useEffect(() => {
    load();
  }, [eventId, isHostMember, user?.id]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${eventId}/${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path);
      const { error } = await supabase.from("gallery_photos").insert({
        event_id: eventId,
        uploaded_by: user.id,
        photo_url: pub.publicUrl,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Photo submitted for review" });
      load();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const moderate = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("gallery_photos").update({ status }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gallery</CardTitle>
        {hasConfirmedRsvp && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-1" /> {uploading ? "Uploading..." : "Upload photo"}
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative group">
                <img src={p.photo_url} alt="" className="aspect-square object-cover rounded w-full" />
                {p.status !== "approved" && (
                  <Badge className="absolute top-1 left-1" variant="secondary">
                    {p.status === "pending" ? "Awaiting approval" : p.status}
                  </Badge>
                )}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {p.status === "approved" && <ReportButton targetType="photo" targetId={p.id} size="icon" />}
                </div>
                {isHostMember && p.status === "pending" && (
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    <Button size="icon" className="h-7 w-7" onClick={() => moderate(p.id, "approved")}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => moderate(p.id, "rejected")}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
