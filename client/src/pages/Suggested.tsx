import { useSuggestedMatches, useRequestMatch } from "@/hooks/use-matches";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, UserPlus, Lightbulb, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";

export default function Suggested() {
  const { data: profiles, isLoading, error } = useSuggestedMatches();
  const { mutate: requestMatch, isPending } = useRequestMatch();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl bg-card/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        {t("client/src/pages/Suggested.tsx", "Failed to load suggested connections.")}
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-display font-bold text-foreground">
            {t("client/src/pages/Suggested.tsx", "Suggested Connections")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("client/src/pages/Suggested.tsx", "Mentor/Mentee matches in your industry.")}
          </p>
        </header>
        <div className="flex flex-col items-center justify-center h-[40vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <Lightbulb className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">
            {t("client/src/pages/Suggested.tsx", "No suggestions yet")}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {t(
              "client/src/pages/Suggested.tsx",
              "We'll suggest mentor/mentee connections when we find people in your industry with complementary goals."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-display font-bold text-foreground">
          {t("client/src/pages/Suggested.tsx", "Suggested Connections")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("client/src/pages/Suggested.tsx", "People in your industry with complementary goals.")}
        </p>
      </header>

      <div className="space-y-6">
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-r from-card to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                      {profile.alias.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold">{profile.alias}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Briefcase className="w-4 h-4" />
                            {Array.isArray(profile.profession) ? profile.profession.join(", ") : profile.profession}
                            <span className="text-xs">•</span>
                            <span>{profile.ageRange}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(profile.goal) ? profile.goal : [profile.goal]).slice(0, 2).map((g: string) => (
                            <Badge key={g} className="bg-primary/20 text-primary border-primary/30 capitalize text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              {g?.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                        {profile.bio}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {profile.interests?.slice(0, 4).map((interest: string) => (
                          <Badge key={interest} variant="secondary" className="text-xs bg-secondary/50">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => requestMatch(profile.id)}
                    disabled={isPending}
                    data-testid={`button-connect-${profile.id}`}
                  >
                    {isPending
                      ? t("client/src/pages/Suggested.tsx", "Sending...")
                      : t("client/src/pages/Suggested.tsx", "Request Connection")}
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
