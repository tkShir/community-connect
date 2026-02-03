import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    window.location.href = "/discover";
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="space-y-4">
          <h1 className="text-4xl font-display font-bold text-primary tracking-tighter">
            ONYX
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            Exclusive Community
          </p>
        </div>

        <div className="w-16 h-px bg-primary/30 mx-auto" />

        <p className="text-muted-foreground leading-relaxed">
          A private network for professionals seeking meaningful connections.
        </p>

        <a href="/api/login" data-testid="button-login">
          <Button 
            size="lg" 
            className="h-12 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Member Login
          </Button>
        </a>
      </div>
    </div>
  );
}
