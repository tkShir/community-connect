import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const ACCESS_CODE = "testtest";
const SESSION_KEY = "onyx_access_granted";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [accessGranted, setAccessGranted] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });
  const [codeInput, setCodeInput] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
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
                    <span
                      className="text-primary font-medium underline underline-offset-2 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsOpen(true);
                      }}
                      data-testid="link-terms"
                    >
                      Terms of Use
                    </span>{" "}
                    and acknowledge that my participation in this community is subject
                    to adherence to the community guidelines.
                  </label>
                </div>

                <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                  <DialogContent className="max-w-lg max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Terms of Use</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground">
                          ONYX Community Platform - Terms of Use
                        </p>
                        <p className="font-medium text-foreground">1. Acceptance of Terms</p>
                        <p>
                          By accessing and using the ONYX platform, you agree to be bound by these
                          Terms of Use. If you do not agree to these terms, you may not use the
                          platform.
                        </p>
                        <p className="font-medium text-foreground">2. Eligibility</p>
                        <p>
                          ONYX is designed for professionals aged 18-35. By using this platform,
                          you confirm that you meet the eligibility requirements and have received
                          a valid access code through an authorized invitation.
                        </p>
                        <p className="font-medium text-foreground">3. Anonymous Profiles</p>
                        <p>
                          Users create profiles using aliases. Your real identity remains hidden
                          until you choose to accept a connection. You agree not to misrepresent
                          your professional background, interests, or intentions on the platform.
                        </p>
                        <p className="font-medium text-foreground">4. Community Conduct</p>
                        <p>
                          You agree to engage respectfully with all community members. Harassment,
                          discrimination, spam, solicitation, or any form of abusive behavior is
                          strictly prohibited and may result in immediate removal from the platform.
                        </p>
                        <p className="font-medium text-foreground">5. Connections &amp; Contact Information</p>
                        <p>
                          When you accept a connection, your chosen contact information (phone,
                          email, or LINE) will be shared with the other party. You are responsible
                          for the information you choose to share and how you use others' contact
                          details.
                        </p>
                        <p className="font-medium text-foreground">6. Events &amp; Groups</p>
                        <p>
                          Users may propose events and suggest interest groups, which are subject
                          to admin approval. The platform reserves the right to approve, deny, or
                          remove any user-submitted content at its discretion.
                        </p>
                        <p className="font-medium text-foreground">7. Privacy</p>
                        <p>
                          We respect your privacy. Your personal data is used solely for the
                          purpose of providing the platform's matching and community features.
                          We do not sell or share your information with third parties.
                        </p>
                        <p className="font-medium text-foreground">8. Account Termination</p>
                        <p>
                          ONYX reserves the right to suspend or terminate any account that
                          violates these terms or community guidelines without prior notice.
                        </p>
                        <p className="font-medium text-foreground">9. Disclaimer</p>
                        <p>
                          The platform is provided "as is" without warranties of any kind. ONYX
                          is not responsible for the outcomes of connections, events, or
                          interactions facilitated through the platform.
                        </p>
                        <p className="font-medium text-foreground">10. Changes to Terms</p>
                        <p>
                          These terms may be updated from time to time. Continued use of the
                          platform after changes constitutes acceptance of the revised terms.
                        </p>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

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

        <a href="/login" data-testid="button-login">
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
