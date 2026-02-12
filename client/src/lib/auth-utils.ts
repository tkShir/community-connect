import { t } from "@/lib/i18n";

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Redirect to login with a toast notification
export function redirectToLogin(
  toast?: (options: { title: string; description: string; variant: string }) => void
) {
  if (toast) {
    toast({
      title: t("auth.unauthorized"),
      description: t("auth.logged_out"),
      variant: "destructive",
    });
  }
  setTimeout(() => {
    window.location.href = "/login";
  }, 500);
}
