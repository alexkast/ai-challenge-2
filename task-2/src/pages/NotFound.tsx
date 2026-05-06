import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-20 space-y-4">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
      <Button asChild><Link to="/">Back to Explore</Link></Button>
    </div>
  );
}
