import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Landing() {
  useLocale();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [termsOpen, setTermsOpen] = useState(false);

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

        <p className="text-xs text-muted-foreground">
          {t("landing.agree_to_terms_before")}
          <span
            className="text-primary underline underline-offset-2 cursor-pointer"
            onClick={() => setTermsOpen(true)}
            data-testid="link-terms"
          >
            {t("landing.terms_of_use")}
          </span>
          {t("landing.agree_to_terms_after")}
        </p>

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
      </div>
    </div>
  );
}
