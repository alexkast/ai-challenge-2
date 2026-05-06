import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, User as UserIcon, LogOut } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasAnyRole, setHasAnyRole] = useState(false);
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHasAnyRole(false);
      setHasHostRole(false);
      setHostId(null);
      return;
    }
    supabase
      .from("host_members")
      .select("role, host_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setHasAnyRole(!!data?.length);
        const hostRow = data?.find((m) => m.role === "host");
        setHasHostRole(!!hostRow);
        setHostId(hostRow?.host_id ?? null);
      });
  }, [user]);

  const redirectQS = `?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Gather
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Explore</Link>
          </Button>
          {user && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/tickets">My Tickets</Link>
            </Button>
          )}
          {user && hasAnyRole && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/my-events">My Events</Link>
            </Button>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs opacity-70">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!hasHostRole && (
                  <DropdownMenuItem onClick={() => navigate("/become-host")}>
                    Become a host
                  </DropdownMenuItem>
                )}
                {hasHostRole && hostId && (
                  <DropdownMenuItem onClick={() => navigate(`/hosts/${hostId}/dashboard`)}>
                    Host Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/login${redirectQS}`}>Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={`/register${redirectQS}`}>Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
