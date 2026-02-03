import { useMyProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function Profile() {
  const { data: profile, isLoading } = useMyProfile();
  const { logout } = useAuth();

  if (isLoading) return <div className="p-10"><Skeleton className="h-96 w-full rounded-3xl" /></div>;

  if (!profile) return null;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">This is how you appear to others anonymously.</p>
        </div>
        <Link href="/onboarding">
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            <Edit className="w-4 h-4 mr-2" /> Edit Persona
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-white/10 overflow-hidden shadow-2xl">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-3xl bg-background border-4 border-card flex items-center justify-center text-primary text-4xl font-bold shadow-xl">
              {profile.alias.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
        
        <CardHeader className="pt-16 pb-6 px-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{profile.alias}</h2>
              <p className="text-lg text-primary mt-1">{profile.profession}</p>
            </div>
            <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm uppercase tracking-wide">
              {profile.goal.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Bio</h3>
            <p className="text-lg leading-relaxed">{profile.bio}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-secondary text-secondary-foreground border border-white/5 py-1.5 px-3">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Hobbies</h3>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map(tag => (
                  <Badge key={tag} variant="outline" className="border-white/10 text-muted-foreground py-1.5 px-3">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-8">
        <Button 
          variant="ghost" 
          onClick={() => logout()}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" /> Log Out
        </Button>
      </div>
    </div>
  );
}
