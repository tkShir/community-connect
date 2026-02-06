import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const ACCESS_CODE = "code";
const SESSION_KEY = "onyx_access_granted";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [accessGranted, setAccessGranted] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });
  const [codeInput, setCodeInput] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/discover");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (codeInput.trim().toLowerCase() !== ACCESS_CODE) {
      setError("Invalid access code. Please try again.");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the Terms of Use to continue.");
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    setAccessGranted(true);
  };

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md w-full">
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
            This is a private, invite-only platform. Enter your access code to continue.
          </p>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCodeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Enter access code"
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        setError("");
                      }}
                      className="pl-10"
                      data-testid="input-access-code"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 text-left">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      setTermsAccepted(checked === true);
                      setError("");
                    }}
                    data-testid="checkbox-terms"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
                  >
                    I agree to the{" "}
                    <span className="text-primary font-medium">Terms of Use</span>{" "}
                    and acknowledge that my participation in this community is subject
                    to adherence to the community guidelines.
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-destructive" data-testid="text-error">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  data-testid="button-enter"
                >
                  Enter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
            className="h-12 px-10 text-lg"
          >
            Member Login
          </Button>
        </a>
      </div>
    </div>
  );
}
