import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-profiles";
import { 
  Users, 
  MessageSquare, 
  UserCircle, 
  LogOut, 
  Menu,
  X,
  Compass
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: profile } = useMyProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If loading or not user, basic wrapper (though usually protected routes handle this)
  if (!user) return <div className="min-h-screen bg-background">{children}</div>;

  const navItems = [
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/chat", label: "Messages", icon: MessageSquare },
    { href: "/profile", label: "My Profile", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-50 sticky top-0">
        <h1 className="text-xl font-display font-bold tracking-tighter text-primary">
          ONYX
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
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
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 border-r border-border bg-card/30 backdrop-blur-xl p-6">
        <div className="mb-12">
          <h1 className="text-3xl font-display font-bold tracking-tighter text-primary">
            ONYX
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium">
            Exclusive Community
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer",
                location.startsWith(item.href)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  location.startsWith(item.href) ? "opacity-100" : "opacity-70"
                )} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-border">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold">
              {profile?.alias?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile?.alias || "Member"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.profession || "Set up profile"}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
