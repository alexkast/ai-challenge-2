import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AcceptInvite() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate(`/login?redirect=/invite/${token}`);
  }, [loading, user, token, navigate]);

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      const { data } = await supabase
        .from("host_members")
        .select("*, host:hosts(id,name)")
        .eq("invite_token", token)
        .maybeSingle();
      if (!data || data.user_id) {
        setError("Invalid or already used invite link");
        return;
      }
      setMember(data);
      setHost(data.host);
    })();
  }, [user, token]);

  const accept = async () => {
    if (!member || !user) return;
    const { error } = await supabase
      .from("host_members")
      .update({ user_id: user.id, joined_at: new Date().toISOString() })
      .eq("id", member.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Welcome to the team!" });
    navigate(`/hosts/${host.id}/dashboard`);
  };

  if (error) return <div className="text-center py-16">{error}</div>;
  if (!member) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Join {host?.name}</CardTitle>
          <CardDescription>You've been invited as a {member.role}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={accept} className="w-full">Accept invite</Button>
        </CardContent>
      </Card>
    </div>
  );
}
