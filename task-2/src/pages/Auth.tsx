import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirect}`,
          data: { full_name: fullName },
        },
      });
      setLoading(false);
      if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      toast({ title: "Welcome!", description: "Account created." });
      navigate(redirect);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      navigate(redirect);
    }
  };

  const otherMode = mode === "login" ? "register" : "login";
  const otherLabel = mode === "login" ? "Create an account" : "Sign in instead";

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
          <CardDescription>
            {mode === "login" ? "Sign in to continue" : "Join Gather to RSVP and host events"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                to={`/${otherMode}${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="text-primary hover:underline"
              >
                {otherLabel}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
