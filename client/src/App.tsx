import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-profiles";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import Discover from "@/pages/Discover";
import Suggested from "@/pages/Suggested";
import Connections from "@/pages/Connections";
import Profile from "@/pages/Profile";
import Events from "@/pages/Events";
import Groups from "@/pages/Groups";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!profile && window.location.pathname !== "/onboarding") {
    setTimeout(() => setLocation("/onboarding"), 0);
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={() => <ProtectedRoute component={Onboarding} />} />
      <Route path="/discover" component={() => <ProtectedRoute component={Discover} />} />
      <Route path="/suggested" component={() => <ProtectedRoute component={Suggested} />} />
      <Route path="/connections" component={() => <ProtectedRoute component={Connections} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/events" component={() => <ProtectedRoute component={Events} />} />
      <Route path="/groups" component={() => <ProtectedRoute component={Groups} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
