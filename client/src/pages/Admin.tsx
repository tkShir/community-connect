import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Profile, Event } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Edit, Search, X, Calendar, Check, XCircle, Plus, Clock, MapPin, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useAdminEvents, usePendingEvents, useApproveEvent, useDenyEvent, useDeleteEvent, useCreateEvent, useUpdateEvent } from "@/hooks/use-events";

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
          Manage users and events on the platform
        </p>
      </header>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="users" data-testid="tab-admin-users">
            <Users className="w-4 h-4 mr-2" />
            Users ({profiles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-admin-events">
            <Calendar className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
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
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsManagement />
        </TabsContent>
      </Tabs>
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

function EventsManagement() {
  const { toast } = useToast();
  const { data: allEvents, isLoading } = useAdminEvents();
  const { data: pendingEvents } = usePendingEvents();
  const { mutate: approveEvent, isPending: isApproving } = useApproveEvent();
  const { mutate: denyEvent, isPending: isDenying } = useDenyEvent();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventDate: "",
    eventTime: "",
    location: "",
    schedule: "",
  });

  const handleApprove = (id: number) => {
    approveEvent(id, {
      onSuccess: () => toast({ title: "Event approved and published!" }),
      onError: () => toast({ title: "Failed to approve event", variant: "destructive" }),
    });
  };

  const handleDenyClick = (id: number) => {
    setSelectedEventId(id);
    setDenyReason("");
    setDenyDialogOpen(true);
  };

  const handleDenyConfirm = () => {
    if (!selectedEventId || !denyReason.trim()) return;
    denyEvent(
      { id: selectedEventId, reason: denyReason },
      {
        onSuccess: () => {
          toast({ title: "Event denied and user notified" });
          setDenyDialogOpen(false);
          setSelectedEventId(null);
          setDenyReason("");
        },
        onError: () => toast({ title: "Failed to deny event", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteEvent(id, {
      onSuccess: () => toast({ title: "Event deleted" }),
      onError: () => toast({ title: "Failed to delete event", variant: "destructive" }),
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent(
      {
        ...newEvent,
        eventDate: new Date(newEvent.eventDate),
        schedule: newEvent.schedule || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Event created and published!" });
          setCreateDialogOpen(false);
          setNewEvent({ title: "", description: "", eventDate: "", eventTime: "", location: "", schedule: "" });
        },
        onError: () => toast({ title: "Failed to create event", variant: "destructive" }),
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600 text-white">Published</Badge>;
      case "pending_approval":
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl bg-card/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Events Management</h2>
          <p className="text-sm text-muted-foreground">
            {pendingEvents?.length || 0} pending approval · {allEvents?.length || 0} total events
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-admin-create-event">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Admin-created events are published immediately.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title"
                  data-testid="input-admin-event-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description"
                  data-testid="input-admin-event-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    data-testid="input-admin-event-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={newEvent.eventTime}
                    onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                    data-testid="input-admin-event-time"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Event location"
                  data-testid="input-admin-event-location"
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule (Optional)</Label>
                <Textarea
                  value={newEvent.schedule}
                  onChange={(e) => setNewEvent({ ...newEvent, schedule: e.target.value })}
                  placeholder="Event schedule"
                  data-testid="input-admin-event-schedule"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating} data-testid="button-admin-submit-event">
                  {isCreating ? "Creating..." : "Create & Publish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingEvents && pendingEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Approval ({pendingEvents.length})
          </h3>
          {pendingEvents.map((event) => (
            <Card key={event.id} className="bg-yellow-500/5 border-yellow-500/20" data-testid={`card-pending-event-${event.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(event.eventDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {event.eventTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(event.id)}
                      disabled={isApproving}
                      data-testid={`button-approve-${event.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDenyClick(event.id)}
                      disabled={isDenying}
                      data-testid={`button-deny-${event.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">All Events</h3>
        {allEvents?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No events yet. Create one to get started.
          </div>
        ) : (
          allEvents?.map((event) => (
            <Card key={event.id} className="bg-card border-white/10" data-testid={`card-event-${event.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      {getStatusBadge(event.status)}
                      {event.createdByAdmin && (
                        <Badge variant="outline" className="text-xs">Admin Created</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(event.eventDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {event.eventTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </span>
                    </div>
                    {event.status === "denied" && event.denialReason && (
                      <p className="text-xs text-destructive mt-2">Denial reason: {event.denialReason}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(event.id)}
                    disabled={isDeleting}
                    data-testid={`button-delete-event-${event.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Event</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this event. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="Reason for denial..."
              data-testid="input-deny-reason"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDenyConfirm}
                disabled={!denyReason.trim() || isDenying}
                data-testid="button-confirm-deny"
              >
                {isDenying ? "Denying..." : "Confirm Denial"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
