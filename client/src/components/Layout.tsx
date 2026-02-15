import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-profiles";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import {
  Users,
  UserCircle,
  LogOut,
  Menu,
  X,
  Compass,
  Bell,
  Lightbulb,
  Shield,
  Calendar,
  UsersRound,
  MessageSquare,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { translateOptionKeys, translateOptionKey } from "@/lib/profile-options";
import { useCustomOptions } from "@/hooks/use-custom-options";

export default function Layout({ children }: { children: React.ReactNode }) {
  useLocale();
  useCustomOptions(); // populate custom options cache app-wide
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: notifications } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <div className="min-h-screen bg-background">{children}</div>;

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const navItems = [
    { href: "/discover", label: t("layout.discover"), icon: Compass },
    { href: "/suggested", label: t("layout.suggested"), icon: Lightbulb },
    { href: "/connections", label: t("layout.connections"), icon: Users },
    { href: "/events", label: t("layout.events"), icon: Calendar },
    { href: "/groups", label: t("layout.groups"), icon: UsersRound },
    { href: "/official", label: t("layout.official"), icon: Building2 },
    { href: "/profile", label: t("layout.my_profile"), icon: UserCircle },
    { href: "/feedback", label: t("layout.feedback"), icon: MessageSquare },
    ...(profile?.isAdmin ? [{ href: "/admin", label: t("layout.admin"), icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-50 sticky top-0">
        <h1 className="text-xl font-display font-bold tracking-tighter text-primary">ONYX</h1>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            markRead={markRead}
          />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur pt-20 px-6 space-y-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-colors",
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </div>
            </Link>
          ))}
          <div className="pt-8 border-t border-border">
            <button
              onClick={() => logout()}
              className="flex items-center gap-4 p-4 rounded-xl text-lg font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
            >
              <LogOut className="w-6 h-6" />
              {t("layout.sign_out")}
            </button>
          </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 border-r border-border bg-card/30 backdrop-blur-xl p-6">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tighter text-primary">ONYX</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium">
              {t("layout.exclusive_community")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              markRead={markRead}
            />
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer",
                  location.startsWith(item.href)
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    location.startsWith(item.href) ? "opacity-100" : "opacity-70"
                  )}
                />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-border">
          <Link href="/profile">
            <div className="flex items-center gap-3 px-2 mb-4 cursor-pointer hover:bg-white/5 rounded-lg py-2 transition-colors" data-testid="link-profile-sidebar">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold">
                {profile?.alias?.substring(0, 2).toUpperCase() ||
                  user.email?.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">
                  {profile?.alias || t("layout.member")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {Array.isArray(profile?.profession)
                    ? translateOptionKeys(profile.profession).join(", ")
                    : profile?.profession ? translateOptionKey(profile.profession) : t("layout.set_up_profile")}
                </p>
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("layout.sign_out")}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12">{children}</div>
      </main>
    </div>
  );
}

function NotificationBell({
  notifications,
  unreadCount,
  markRead,
}: {
  notifications: any[] | undefined;
  unreadCount: number;
  markRead: (id: number) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {!notifications || notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {t("layout.no_notifications")}
          </div>
        ) : (
          notifications.map((notif: any) => (
            <DropdownMenuItem
              key={notif.id}
              onClick={() => !notif.isRead && markRead(notif.id)}
              className={cn("flex flex-col items-start gap-1 p-3", !notif.isRead && "bg-primary/5")}
            >
              <p className="text-sm">{notif.content}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(notif.createdAt).toLocaleDateString()}
              </p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
