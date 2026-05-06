import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Explore from "./pages/Explore";
import AuthPage from "./pages/Auth";
import BecomeHost from "./pages/BecomeHost";
import MyTickets from "./pages/MyTickets";
import MyEvents from "./pages/MyEvents";
import EventDetail from "./pages/EventDetail";
import EventEditor from "./pages/EventEditor";
import HostProfile from "./pages/HostProfile";
import HostDashboard from "./pages/HostDashboard";
import CheckIn from "./pages/CheckIn";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Explore />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/become-host" element={<BecomeHost />} />
                <Route path="/tickets" element={<MyTickets />} />
                <Route path="/my-events" element={<MyEvents />} />
                <Route path="/events/new" element={<EventEditor />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/events/:id/edit" element={<EventEditor />} />
                <Route path="/events/:id/checkin" element={<CheckIn />} />
                <Route path="/hosts/:id" element={<HostProfile />} />
                <Route path="/hosts/:id/dashboard" element={<HostDashboard />} />
                <Route path="/invite/:token" element={<AcceptInvite />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
