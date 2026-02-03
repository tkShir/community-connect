import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Profile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Edit, Search, X } from "lucide-react";
import { useState } from "react";

export default function Admin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const { data: profiles, isLoading, error } = useQuery<Profile[]>({
    queryKey: ["/api/admin/profiles"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Profile> }) => {
      const res = await apiRequest("PATCH", `/api/admin/profiles/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      setEditingProfile(null);
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Admin Dashboard
          </h1>
        </header>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-card/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Shield className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  const filteredProfiles = profiles?.filter(
    (p) =>
      p.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profession.some((prof) => prof.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
          <Shield className="w-10 h-10 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage all users on the platform ({profiles?.length || 0} total)
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by alias or profession..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card border-white/10"
          data-testid="input-admin-search"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => setSearchTerm("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredProfiles?.map((profile) => (
          <Card key={profile.id} className="bg-card border-white/10" data-testid={`card-user-${profile.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{profile.alias}</h3>
                      {profile.isAdmin && (
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {profile.profession.join(", ")} · {profile.ageRange}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Goals: {profile.goal.join(", ")}
                    </p>
                  </div>
                </div>

                <Dialog open={editingProfile?.id === profile.id} onOpenChange={(open) => !open && setEditingProfile(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                      data-testid={`button-edit-${profile.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-white/10">
                    <DialogHeader>
                      <DialogTitle>Edit User: {profile.alias}</DialogTitle>
                    </DialogHeader>
                    <EditProfileForm
                      profile={profile}
                      onSave={(updates) => updateMutation.mutate({ id: profile.id, updates })}
                      isPending={updateMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProfiles?.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No users found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}

function EditProfileForm({
  profile,
  onSave,
  isPending,
}: {
  profile: Profile;
  onSave: (updates: Partial<Profile>) => void;
  isPending: boolean;
}) {
  const [alias, setAlias] = useState(profile.alias);
  const [bio, setBio] = useState(profile.bio);
  const [ageRange, setAgeRange] = useState(profile.ageRange);
  const [isAdmin, setIsAdmin] = useState(profile.isAdmin);
  const [contactMethod, setContactMethod] = useState(profile.contactMethod);
  const [contactValue, setContactValue] = useState(profile.contactValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ alias, bio, ageRange, isAdmin, contactMethod, contactValue });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="alias">Alias</Label>
        <Input
          id="alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="bg-background border-white/10"
          data-testid="input-edit-alias"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Input
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="bg-background border-white/10"
          data-testid="input-edit-bio"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ageRange">Age Range</Label>
          <Select value={ageRange} onValueChange={setAgeRange}>
            <SelectTrigger className="bg-background border-white/10" data-testid="select-edit-age">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["below 18", "18-22", "23-26", "27-30", "30-34", "above 34"].map((range) => (
                <SelectItem key={range} value={range}>
                  {range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="isAdmin">Admin Status</Label>
          <Select value={isAdmin ? "true" : "false"} onValueChange={(v) => setIsAdmin(v === "true")}>
            <SelectTrigger className="bg-background border-white/10" data-testid="select-edit-admin">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Regular User</SelectItem>
              <SelectItem value="true">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactMethod">Contact Method</Label>
          <Select value={contactMethod} onValueChange={setContactMethod}>
            <SelectTrigger className="bg-background border-white/10" data-testid="select-edit-contact-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Phone", "Email", "LINE"].map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactValue">Contact Info</Label>
          <Input
            id="contactValue"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            className="bg-background border-white/10"
            data-testid="input-edit-contact-value"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isPending}
        data-testid="button-save-profile"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
