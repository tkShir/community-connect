import { useMatches, useRespondMatch } from "@/hooks/use-matches";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Phone, Mail, MessageCircle, Users } from "lucide-react";
import { t } from "@/lib/i18n";

export default function Connections() {
  const { data: matches, isLoading } = useMatches();
  const { mutate: respond } = useRespondMatch();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const pendingRequests = matches?.filter(
    (m) => m.status === "pending" && m.initiatorId === m.partnerProfile.id
  ) || [];
  const acceptedConnections = matches?.filter((m) => m.status === "accepted") || [];
  const sentRequests = matches?.filter(
    (m) => m.status === "pending" && m.initiatorId !== m.partnerProfile.id
  ) || [];

  const getContactIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "line":
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-display font-bold text-foreground">
          {t("client/src/pages/Connections.tsx", "Connections")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t(
            "client/src/pages/Connections.tsx",
            "Manage your connection requests and view contact details."
          )}
        </p>
      </header>

      {pendingRequests.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
            {t(
              "client/src/pages/Connections.tsx",
              "Incoming Requests ({pendingRequests.length})"
            ).replace("{pendingRequests.length}", String(pendingRequests.length))}
          </h2>
          {pendingRequests.map((match) => (
            <Card key={match.id} className="bg-card border-primary/20">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {match.partnerProfile.alias.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold">{match.partnerProfile.alias}</h3>
                    <p className="text-sm text-muted-foreground">
                      {Array.isArray(match.partnerProfile.profession) ? match.partnerProfile.profession.join(", ") : match.partnerProfile.profession}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(match.partnerProfile.goal) ? match.partnerProfile.goal : [match.partnerProfile.goal]).slice(0, 2).map((g: string) => (
                        <Badge key={g} variant="outline" className="text-xs capitalize">
                          {g?.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respond({ id: match.id, status: "accepted" })}
                    className="bg-primary text-primary-foreground"
                    data-testid={`button-accept-${match.id}`}
                  >
                    <Check className="w-4 h-4 mr-1" />{" "}
                    {t("client/src/pages/Connections.tsx", "Accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => respond({ id: match.id, status: "rejected" })}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid={`button-reject-${match.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {sentRequests.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
            {t(
              "client/src/pages/Connections.tsx",
              "Pending Sent Requests ({sentRequests.length})"
            ).replace("{sentRequests.length}", String(sentRequests.length))}
          </h2>
          {sentRequests.map((match) => (
            <Card key={match.id} className="bg-card/50 border-white/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground font-bold">
                  {match.partnerProfile.alias.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{match.partnerProfile.alias}</h3>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(match.partnerProfile.profession) ? match.partnerProfile.profession.join(", ") : match.partnerProfile.profession}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {t("client/src/pages/Connections.tsx", "Waiting for response")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
          {t(
            "client/src/pages/Connections.tsx",
            "Accepted Connections ({acceptedConnections.length})"
          ).replace("{acceptedConnections.length}", String(acceptedConnections.length))}
        </h2>
        {acceptedConnections.length === 0 ? (
          <Card className="bg-card/30 border-white/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {t(
                  "client/src/pages/Connections.tsx",
                  "No connections yet. Discover new people to connect with!"
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          acceptedConnections.map((match) => (
            <Card key={match.id} className="bg-card border-white/5 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {match.partnerProfile.alias.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{match.partnerProfile.alias}</h3>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(match.partnerProfile.profession) ? match.partnerProfile.profession.join(", ") : match.partnerProfile.profession}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {match.partnerProfile.ageRange}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    {getContactIcon(match.partnerProfile.contactMethod)}
                    <span className="text-muted-foreground">{match.partnerProfile.contactMethod}:</span>
                    <span className="font-medium text-primary">{match.partnerProfile.contactValue}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {match.partnerProfile.interests?.slice(0, 3).map((interest: string) => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
