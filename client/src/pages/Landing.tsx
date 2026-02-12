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
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const ACCESS_CODE = "testtest";
const SESSION_KEY = "onyx_access_granted";

export default function Landing() {
  useLocale();
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
      setError(t("landing.invalid_access_code"));
      return;
    }

    if (!termsAccepted) {
      setError(t("landing.must_accept_terms"));
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    setAccessGranted(true);
  };

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md w-full">
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-display font-bold text-primary tracking-tighter">
              ONYX
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">
              {t("landing.exclusive_community")}
            </p>
          </div>

          <div className="w-16 h-px bg-primary/30 mx-auto" />

          <p className="text-muted-foreground leading-relaxed">
            {t("landing.private_invite_only")}
          </p>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCodeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder={t("landing.enter_access_code")}
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
                    {t("landing.agree_to_terms_before")}
                    <span
                      className="text-primary font-medium underline underline-offset-2 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsOpen(true);
                      }}
                      data-testid="link-terms"
                    >
                      {t("landing.terms_of_use")}
                    </span>
                    {t("landing.agree_to_terms_after")}
                  </label>
                </div>

                <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                  <DialogContent className="max-w-lg max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">
                        {t("landing.terms_of_use")}
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground">
                          {t("landing.terms_title")}
                        </p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_acceptance")}
                        </p>
                        <p>{t("landing.terms_acceptance_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_eligibility")}
                        </p>
                        <p>{t("landing.terms_eligibility_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_anonymous_profiles")}
                        </p>
                        <p>{t("landing.terms_anonymous_profiles_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_community_conduct")}
                        </p>
                        <p>{t("landing.terms_community_conduct_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_connections")}
                        </p>
                        <p>{t("landing.terms_connections_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_events_groups")}
                        </p>
                        <p>{t("landing.terms_events_groups_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_privacy")}
                        </p>
                        <p>{t("landing.terms_privacy_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_account_termination")}
                        </p>
                        <p>{t("landing.terms_account_termination_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_disclaimer")}
                        </p>
                        <p>{t("landing.terms_disclaimer_body")}</p>
                        <p className="font-medium text-foreground">
                          {t("landing.terms_changes")}
                        </p>
                        <p>{t("landing.terms_changes_body")}</p>
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
                  {t("landing.enter")}
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
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-display font-bold text-primary tracking-tighter">
            ONYX
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            {t("landing.exclusive_community")}
          </p>
        </div>

        <div className="w-16 h-px bg-primary/30 mx-auto" />

        <p className="text-muted-foreground leading-relaxed">
          {t("landing.tagline")}
        </p>

        <a href="/login" data-testid="button-login">
          <Button
            size="lg"
            className="h-12 px-10 text-lg"
          >
            {t("landing.member_login")}
          </Button>
        </a>
      </div>
    </div>
  );
}
