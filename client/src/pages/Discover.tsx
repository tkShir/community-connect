import { usePotentialMatches, useRequestMatch } from "@/hooks/use-matches";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, UserPlus, Star, Hash, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Discover() {
  const { data: profiles, isLoading, error } = usePotentialMatches();
  const { mutate: requestMatch, isPending } = useRequestMatch();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[400px] w-full rounded-2xl bg-card/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">Failed to load recommendations.</div>;
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">No new recommendations</h2>
        <p className="text-muted-foreground max-w-md">
          We've run out of potential matches for now. Check back later as more members join the circle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-display font-bold text-foreground">Discover</h1>
        <p className="text-muted-foreground mt-2">Find your next connection based on shared interests.</p>
      </header>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              layout
            >
              <Card className="h-full flex flex-col bg-card border-white/5 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 overflow-hidden group">
                <div className="h-24 bg-gradient-to-r from-secondary to-background relative">
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg transform group-hover:scale-105 transition-transform">
                      {profile.alias.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pt-10 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{profile.alias}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Briefcase className="w-3.5 h-3.5 mr-2" />
                        {Array.isArray(profile.profession) ? profile.profession.join(", ") : profile.profession}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {(Array.isArray(profile.goal) ? profile.goal.slice(0, 2) : [profile.goal]).map((g: string) => (
                        <Badge key={g} variant="outline" className="border-primary/30 text-primary capitalize text-xs">
                          {g?.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {profile.bio}
                  </p>

                  <div className="space-y-3">
                    {profile.interests && profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-secondary/50 text-xs">
                            <Star className="w-3 h-3 mr-1 opacity-50" /> {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {profile.hobbies && profile.hobbies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.hobbies.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-secondary/30 text-xs text-muted-foreground">
                            <Hash className="w-3 h-3 mr-1 opacity-50" /> {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-white/5 bg-white/[0.02]">
                  <Button 
                    className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-semibold"
                    onClick={() => requestMatch(profile.id)}
                    disabled={isPending}
                  >
                    {isPending ? "Sending..." : "Connect Anonymously"} 
                    {!isPending && <UserPlus className="ml-2 w-4 h-4" />}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
