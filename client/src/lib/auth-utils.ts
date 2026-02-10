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
      title: t("client/src/lib/auth-utils.ts", "Unauthorized"),
      description: t(
        "client/src/lib/auth-utils.ts",
        "You are logged out. Logging in again..."
      ),
      variant: "destructive",
    });
  }
  setTimeout(() => {
    window.location.href = "/login";
  }, 500);
}
