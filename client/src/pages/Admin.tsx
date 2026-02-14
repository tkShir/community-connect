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
import { Shield, User, Edit, Search, X, Calendar, Check, XCircle, Plus, Clock, MapPin, Trash2, Users, UsersRound, ExternalLink, Link as LinkIcon, Languages, Save, MessageSquare, Mail, UserCircle } from "lucide-react";
import { useState } from "react";
import { useAdminEvents, usePendingEvents, useApproveEvent, useDenyEvent, useDeleteEvent, useCreateEvent, useUpdateEvent } from "@/hooks/use-events";
import { useAdminGroups, usePendingGroups, useApproveGroup, useDenyGroup, useDeleteGroup, useCreateGroup, useUpdateGroup } from "@/hooks/use-groups";
import { useAdminCustomOptions, useUpdateCustomOption, useDeleteCustomOption } from "@/hooks/use-custom-options";
import { useAdminFeedback, useDeleteFeedback } from "@/hooks/use-feedback";
import type { Group, CustomOption, Feedback } from "@shared/schema";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { translateOptionKey, translateOptionKeys, buildOptions, AGE_RANGE_KEYS, CONTACT_METHOD_KEYS, migrateToKey } from "@/lib/profile-options";

export default function Admin() {
  useLocale();
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
      toast({ title: t("admin.profile_updated") });
    },
    onError: () => {
      toast({ title: t("admin.profile_update_failed"), variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            {t("admin.admin_dashboard")}
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
        <h2 className="text-2xl font-display font-bold mb-2">{t("admin.access_denied")}</h2>
        <p className="text-muted-foreground">{t("admin.no_permission")}</p>
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
          {t("admin.admin_dashboard")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.manage_platform")}
        </p>
      </header>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-[900px]">
          <TabsTrigger value="users" data-testid="tab-admin-users">
            <Users className="w-4 h-4 mr-2" />
            {t("admin.users_count", { count: profiles?.length || 0 })}
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-admin-events">
            <Calendar className="w-4 h-4 mr-2" />
            {t("admin.events")}
          </TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-admin-groups">
            <UsersRound className="w-4 h-4 mr-2" />
            {t("admin.groups")}
          </TabsTrigger>
          <TabsTrigger value="feedback" data-testid="tab-admin-feedback">
            <MessageSquare className="w-4 h-4 mr-2" />
            {t("admin.feedback")}
          </TabsTrigger>
          <TabsTrigger value="custom-options" data-testid="tab-admin-custom-options">
            <Languages className="w-4 h-4 mr-2" />
            {t("admin.custom_options")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t("admin.search_placeholder")}
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
                              {t("admin.admin")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {translateOptionKeys(profile.profession).join(", ")} · {translateOptionKey(profile.ageRange)}
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
                {t("admin.no_users_found", { searchTerm })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsManagement />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <GroupsManagement />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackManagement />
        </TabsContent>

        <TabsContent value="custom-options" className="mt-6">
          <CustomOptionsManagement />
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
  useLocale();
  const [alias, setAlias] = useState(profile.alias);
  const [bio, setBio] = useState(profile.bio);
  const [ageRange, setAgeRange] = useState(migrateToKey(profile.ageRange));
  const [isAdmin, setIsAdmin] = useState(profile.isAdmin);
  const [contactMethod, setContactMethod] = useState(migrateToKey(profile.contactMethod));
  const [contactValue, setContactValue] = useState(profile.contactValue);

  const ageRangeOptions = buildOptions(AGE_RANGE_KEYS);
  const contactMethodOptions = buildOptions(CONTACT_METHOD_KEYS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ alias, bio, ageRange, isAdmin, contactMethod, contactValue });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="alias">{t("admin.alias")}</Label>
        <Input
          id="alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="bg-background border-white/10"
          data-testid="input-edit-alias"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t("admin.bio")}</Label>
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
          <Label htmlFor="ageRange">{t("admin.age_range")}</Label>
          <Select value={ageRange} onValueChange={setAgeRange}>
            <SelectTrigger className="bg-background border-white/10" data-testid="select-edit-age">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ageRangeOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="isAdmin">{t("admin.admin_status")}</Label>
          <Select value={isAdmin ? "true" : "false"} onValueChange={(v) => setIsAdmin(v === "true")}>
            <SelectTrigger className="bg-background border-white/10" data-testid="select-edit-admin">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">{t("admin.regular_user")}</SelectItem>
              <SelectItem value="true">{t("admin.admin")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactMethod">{t("admin.contact_method")}</Label>
          <Select value={contactMethod} onValueChange={setContactMethod}>
            <SelectTrigger className="bg-background border-white/10" data-testid="select-edit-contact-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contactMethodOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactValue">{t("admin.contact_info")}</Label>
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
        {isPending ? t("admin.saving") : t("admin.save_changes")}
      </Button>
    </form>
  );
}

function EventsManagement() {
  useLocale();
  const { toast } = useToast();
  const { data: allEvents, isLoading } = useAdminEvents();
  const { data: pendingEvents } = usePendingEvents();
  const { mutate: approveEvent, isPending: isApproving } = useApproveEvent();
  const { mutate: denyEvent, isPending: isDenying } = useDenyEvent();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventDate: "",
    eventTime: "",
    location: "",
    schedule: "",
    googleFormLink: "",
  });

  const handleApprove = (id: number) => {
    approveEvent(id, {
      onSuccess: () => toast({ title: t("admin.event_approved") }),
      onError: () => toast({ title: t("admin.event_approve_failed"), variant: "destructive" }),
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
          toast({ title: t("admin.event_denied") });
          setDenyDialogOpen(false);
          setSelectedEventId(null);
          setDenyReason("");
        },
        onError: () => toast({ title: t("admin.event_deny_failed"), variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteEvent(id, {
      onSuccess: () => toast({ title: t("admin.event_deleted") }),
      onError: () => toast({ title: t("admin.event_delete_failed"), variant: "destructive" }),
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent(
      {
        ...newEvent,
        eventDate: new Date(newEvent.eventDate),
        schedule: newEvent.schedule || null,
        googleFormLink: newEvent.googleFormLink || null,
      },
      {
        onSuccess: () => {
          toast({ title: t("admin.event_created") });
          setCreateDialogOpen(false);
          setNewEvent({ title: "", description: "", eventDate: "", eventTime: "", location: "", schedule: "", googleFormLink: "" });
        },
        onError: () => toast({ title: t("admin.event_create_failed"), variant: "destructive" }),
      }
    );
  };

  const handleEditSave = () => {
    if (!editingEvent) return;
    updateEvent(
      {
        id: editingEvent.id,
        data: {
          title: editingEvent.title,
          description: editingEvent.description,
          eventDate: editingEvent.eventDate,
          eventTime: editingEvent.eventTime,
          location: editingEvent.location,
          schedule: editingEvent.schedule,
          googleFormLink: editingEvent.googleFormLink,
        },
      },
      {
        onSuccess: () => {
          toast({ title: t("admin.event_updated") });
          setEditingEvent(null);
        },
        onError: () => toast({ title: t("admin.event_update_failed"), variant: "destructive" }),
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600 text-white">{t("events.published")}</Badge>;
      case "pending_approval":
        return <Badge className="bg-yellow-600 text-white">{t("events.pending_approval")}</Badge>;
      case "denied":
        return <Badge variant="destructive">{t("events.denied")}</Badge>;
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
          <h2 className="text-xl font-semibold">{t("admin.events_management")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.events_summary", { total: allEvents?.length || 0 })}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-admin-create-event">
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.create_event")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("admin.create_new_event")}</DialogTitle>
              <DialogDescription>{t("admin.admin_events_note")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.title")}</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder={t("admin.event_title")}
                  data-testid="input-admin-event-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("events.description")}</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder={t("admin.event_description")}
                  data-testid="input-admin-event-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("events.date")}</Label>
                  <Input
                    type="date"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    data-testid="input-admin-event-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("events.time")}</Label>
                  <Input
                    type="time"
                    value={newEvent.eventTime}
                    onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                    data-testid="input-admin-event-time"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("events.location")}</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder={t("admin.event_location")}
                  data-testid="input-admin-event-location"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("events.schedule_optional")}</Label>
                <Textarea
                  value={newEvent.schedule}
                  onChange={(e) => setNewEvent({ ...newEvent, schedule: e.target.value })}
                  placeholder={t("admin.event_schedule")}
                  data-testid="input-admin-event-schedule"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.google_form_link")}</Label>
                <Input
                  value={newEvent.googleFormLink}
                  onChange={(e) => setNewEvent({ ...newEvent, googleFormLink: e.target.value })}
                  placeholder={t("admin.google_form_link_placeholder")}
                  data-testid="input-admin-event-google-form"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating} data-testid="button-admin-submit-event">
                  {isCreating ? t("admin.creating") : t("admin.create_and_publish")}
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
            {t("admin.pending_approval_count", { count: pendingEvents.length })}
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
                      {t("admin.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDenyClick(event.id)}
                      disabled={isDenying}
                      data-testid={`button-deny-${event.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {t("admin.deny")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("admin.all_events")}</h3>
        {allEvents?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {t("admin.no_events_message")}
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
                        <Badge variant="outline" className="text-xs">{t("admin.admin_created")}</Badge>
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
                    {event.googleFormLink && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-1">
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[300px]">{event.googleFormLink}</span>
                      </div>
                    )}
                    {event.status === "denied" && event.denialReason && (
                      <p className="text-xs text-destructive mt-2">{t("admin.denial_reason_display", { reason: event.denialReason })}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={editingEvent?.id === event.id} onOpenChange={(open) => !open && setEditingEvent(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingEvent({ ...event })}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>{t("admin.edit_event")}</DialogTitle>
                        </DialogHeader>
                        {editingEvent && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>{t("admin.title")}</Label>
                              <Input
                                value={editingEvent.title}
                                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                data-testid="input-edit-event-title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("events.description")}</Label>
                              <Textarea
                                value={editingEvent.description}
                                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                data-testid="input-edit-event-description"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t("events.date")}</Label>
                                <Input
                                  type="date"
                                  value={editingEvent.eventDate ? new Date(editingEvent.eventDate).toISOString().split("T")[0] : ""}
                                  onChange={(e) => setEditingEvent({ ...editingEvent, eventDate: new Date(e.target.value) })}
                                  data-testid="input-edit-event-date"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("events.time")}</Label>
                                <Input
                                  type="time"
                                  value={editingEvent.eventTime}
                                  onChange={(e) => setEditingEvent({ ...editingEvent, eventTime: e.target.value })}
                                  data-testid="input-edit-event-time"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>{t("events.location")}</Label>
                              <Input
                                value={editingEvent.location}
                                onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                data-testid="input-edit-event-location"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("events.schedule_optional")}</Label>
                              <Textarea
                                value={editingEvent.schedule || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, schedule: e.target.value })}
                                data-testid="input-edit-event-schedule"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("admin.google_form_link")}</Label>
                              <Input
                                value={editingEvent.googleFormLink || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, googleFormLink: e.target.value || null })}
                                placeholder={t("admin.google_form_link_placeholder")}
                                data-testid="input-edit-event-google-form"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                                {t("admin.cancel")}
                              </Button>
                              <Button onClick={handleEditSave} disabled={isUpdating} data-testid="button-save-event">
                                {isUpdating ? t("admin.saving") : t("admin.save_changes")}
                              </Button>
                            </DialogFooter>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
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
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.deny_event")}</DialogTitle>
            <DialogDescription>{t("admin.deny_event_prompt")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder={t("admin.denial_reason_placeholder")}
              data-testid="input-deny-reason"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>
                {t("admin.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDenyConfirm}
                disabled={!denyReason.trim() || isDenying}
                data-testid="button-confirm-deny"
              >
                {isDenying ? t("admin.denying") : t("admin.confirm_denial")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupsManagement() {
  useLocale();
  const { toast } = useToast();
  const { data: allGroups, isLoading } = useAdminGroups();
  const { data: pendingGroups } = usePendingGroups();
  const { mutate: approveGroup, isPending: isApproving } = useApproveGroup();
  const { mutate: denyGroup, isPending: isDenying } = useDenyGroup();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();
  const { mutate: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup();

  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState({
    title: "",
    description: "",
    lineGroupLink: "",
  });

  const handleApprove = (id: number) => {
    approveGroup(id, {
      onSuccess: () => toast({ title: t("admin.group_approved") }),
      onError: () => toast({ title: t("admin.group_approve_failed"), variant: "destructive" }),
    });
  };

  const handleDenyClick = (id: number) => {
    setSelectedGroupId(id);
    setDenyReason("");
    setDenyDialogOpen(true);
  };

  const handleDenyConfirm = () => {
    if (!selectedGroupId || !denyReason.trim()) return;
    denyGroup(
      { id: selectedGroupId, reason: denyReason },
      {
        onSuccess: () => {
          toast({ title: t("admin.group_denied") });
          setDenyDialogOpen(false);
          setSelectedGroupId(null);
          setDenyReason("");
        },
        onError: () => toast({ title: t("admin.group_deny_failed"), variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteGroup(id, {
      onSuccess: () => toast({ title: t("admin.group_deleted") }),
      onError: () => toast({ title: t("admin.group_delete_failed"), variant: "destructive" }),
    });
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    createGroup(
      {
        ...newGroup,
        lineGroupLink: newGroup.lineGroupLink || null,
      },
      {
        onSuccess: () => {
          toast({ title: t("admin.group_created") });
          setCreateDialogOpen(false);
          setNewGroup({ title: "", description: "", lineGroupLink: "" });
        },
        onError: () => toast({ title: t("admin.group_create_failed"), variant: "destructive" }),
      }
    );
  };

  const handleEditSave = () => {
    if (!editingGroup) return;
    updateGroup(
      {
        id: editingGroup.id,
        data: {
          title: editingGroup.title,
          description: editingGroup.description,
          lineGroupLink: editingGroup.lineGroupLink,
        },
      },
      {
        onSuccess: () => {
          toast({ title: t("admin.group_updated") });
          setEditingGroup(null);
        },
        onError: () => toast({ title: t("admin.group_update_failed"), variant: "destructive" }),
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600 text-white">{t("groups.published")}</Badge>;
      case "pending_approval":
        return <Badge className="bg-yellow-600 text-white">{t("groups.pending_approval")}</Badge>;
      case "denied":
        return <Badge variant="destructive">{t("groups.denied")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-card/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t("admin.groups_management")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.groups_summary", { pending: pendingGroups?.length || 0, total: allGroups?.length || 0 })}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-admin-create-group">
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.create_group")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("admin.create_new_group")}</DialogTitle>
              <DialogDescription>{t("admin.admin_groups_note")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.title")}</Label>
                <Input
                  value={newGroup.title}
                  onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
                  placeholder={t("admin.group_name")}
                  data-testid="input-admin-group-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("groups.description")}</Label>
                <Textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder={t("admin.group_description")}
                  data-testid="input-admin-group-description"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.line_group_link")}</Label>
                <Input
                  value={newGroup.lineGroupLink}
                  onChange={(e) => setNewGroup({ ...newGroup, lineGroupLink: e.target.value })}
                  placeholder={t("admin.line_link_placeholder")}
                  data-testid="input-admin-group-link"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating} data-testid="button-admin-submit-group">
                  {isCreating ? t("admin.creating") : t("admin.create_and_publish")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingGroups && pendingGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            {t("admin.pending_approval_count", { count: pendingGroups.length })}
          </h3>
          {pendingGroups.map((group) => (
            <Card key={group.id} className="bg-yellow-500/5 border-yellow-500/20" data-testid={`card-pending-group-${group.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{group.title}</h4>
                      {getStatusBadge(group.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(group.id)}
                      disabled={isApproving}
                      data-testid={`button-approve-group-${group.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {t("admin.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDenyClick(group.id)}
                      disabled={isDenying}
                      data-testid={`button-deny-group-${group.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {t("admin.deny")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("admin.all_groups")}</h3>
        {allGroups?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {t("admin.no_groups_message")}
          </div>
        ) : (
          allGroups?.map((group) => (
            <Card key={group.id} className="bg-card border-white/10" data-testid={`card-admin-group-${group.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold">{group.title}</h4>
                      {getStatusBadge(group.status)}
                      {group.createdByAdmin && (
                        <Badge variant="outline" className="text-xs">{t("admin.admin_created")}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                    {group.lineGroupLink && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[300px]">{group.lineGroupLink}</span>
                      </div>
                    )}
                    {group.status === "denied" && group.denialReason && (
                      <p className="text-xs text-destructive mt-2">{t("admin.denial_reason_group_display", { reason: group.denialReason })}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={editingGroup?.id === group.id} onOpenChange={(open) => !open && setEditingGroup(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingGroup({ ...group })}
                          data-testid={`button-edit-group-${group.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>{t("admin.edit_group")}</DialogTitle>
                        </DialogHeader>
                        {editingGroup && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>{t("admin.title")}</Label>
                              <Input
                                value={editingGroup.title}
                                onChange={(e) => setEditingGroup({ ...editingGroup, title: e.target.value })}
                                data-testid="input-edit-group-title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("groups.description")}</Label>
                              <Textarea
                                value={editingGroup.description}
                                onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                data-testid="input-edit-group-description"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("admin.line_group_link")}</Label>
                              <Input
                                value={editingGroup.lineGroupLink || ""}
                                onChange={(e) => setEditingGroup({ ...editingGroup, lineGroupLink: e.target.value })}
                                placeholder={t("admin.line_link_placeholder")}
                                data-testid="input-edit-group-link"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingGroup(null)}>
                                {t("admin.cancel")}
                              </Button>
                              <Button onClick={handleEditSave} disabled={isUpdating} data-testid="button-save-group">
                                {isUpdating ? t("admin.saving") : t("admin.save_changes")}
                              </Button>
                            </DialogFooter>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(group.id)}
                      disabled={isDeleting}
                      data-testid={`button-delete-group-${group.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.deny_group")}</DialogTitle>
            <DialogDescription>{t("admin.deny_group_prompt")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder={t("admin.denial_reason_placeholder")}
              data-testid="input-deny-group-reason"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>
                {t("admin.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDenyConfirm}
                disabled={!denyReason.trim() || isDenying}
                data-testid="button-confirm-deny-group"
              >
                {isDenying ? t("admin.denying_group") : t("admin.confirm_denial_group")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomOptionsManagement() {
  useLocale();
  const { toast } = useToast();
  const { data: customOptions, isLoading } = useAdminCustomOptions();
  const { mutate: updateOption, isPending: isUpdating } = useUpdateCustomOption();
  const { mutate: deleteOption, isPending: isDeleting } = useDeleteCustomOption();

  const [edits, setEdits] = useState<Record<number, { labelEn: string; labelJa: string }>>({});

  const startEdit = (opt: CustomOption) => {
    setEdits((prev) => ({ ...prev, [opt.id]: { labelEn: opt.labelEn, labelJa: opt.labelJa } }));
  };

  const cancelEdit = (id: number) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSave = (id: number) => {
    const edit = edits[id];
    if (!edit) return;
    updateOption(
      { id, data: { labelEn: edit.labelEn, labelJa: edit.labelJa } },
      {
        onSuccess: () => {
          toast({ title: t("admin.custom_option_updated") });
          cancelEdit(id);
        },
        onError: () => toast({ title: t("admin.custom_option_update_failed"), variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteOption(id, {
      onSuccess: () => toast({ title: t("admin.custom_option_deleted") }),
      onError: () => toast({ title: t("admin.custom_option_delete_failed"), variant: "destructive" }),
    });
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case "profession": return t("admin.category_profession");
      case "interests": return t("admin.category_interests");
      case "hobbies": return t("admin.category_hobbies");
      default: return cat;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-card/50" />
        ))}
      </div>
    );
  }

  const grouped: Record<string, CustomOption[]> = {};
  for (const opt of customOptions || []) {
    if (!grouped[opt.category]) grouped[opt.category] = [];
    grouped[opt.category].push(opt);
  }

  const categories = ["profession", "interests", "hobbies"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("admin.custom_options_management")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.custom_options_description")}
        </p>
      </div>

      {categories.map((cat) => {
        const options = grouped[cat] || [];
        return (
          <div key={cat} className="space-y-3">
            <h3 className="text-lg font-medium">{categoryLabel(cat)} ({options.length})</h3>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.no_custom_options")}</p>
            ) : (
              <div className="grid gap-3">
                {options.map((opt) => {
                  const editing = edits[opt.id];
                  return (
                    <Card key={opt.id} className="bg-card border-white/10" data-testid={`card-custom-option-${opt.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-sm text-muted-foreground">{t("admin.key")}:</span>{" "}
                              <span className="font-semibold">{opt.originalValue}</span>
                            </div>
                            <div className="flex gap-2">
                              {!editing && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(opt)}
                                  data-testid={`button-edit-option-${opt.id}`}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  {t("admin.edit")}
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(opt.id)}
                                disabled={isDeleting}
                                data-testid={`button-delete-option-${opt.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {editing ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">{t("admin.label_en")}</Label>
                                  <Input
                                    value={editing.labelEn}
                                    onChange={(e) =>
                                      setEdits((prev) => ({
                                        ...prev,
                                        [opt.id]: { ...prev[opt.id], labelEn: e.target.value },
                                      }))
                                    }
                                    className="bg-background border-white/10"
                                    data-testid={`input-label-en-${opt.id}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">{t("admin.label_ja")}</Label>
                                  <Input
                                    value={editing.labelJa}
                                    onChange={(e) =>
                                      setEdits((prev) => ({
                                        ...prev,
                                        [opt.id]: { ...prev[opt.id], labelJa: e.target.value },
                                      }))
                                    }
                                    className="bg-background border-white/10"
                                    data-testid={`input-label-ja-${opt.id}`}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => cancelEdit(opt.id)}>
                                  {t("admin.cancel")}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(opt.id)}
                                  disabled={isUpdating}
                                  data-testid={`button-save-option-${opt.id}`}
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  {isUpdating ? t("admin.saving") : t("admin.save_changes")}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t("admin.label_en")}:</span>{" "}
                                {opt.labelEn}
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t("admin.label_ja")}:</span>{" "}
                                {opt.labelJa}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {(!customOptions || customOptions.length === 0) && (
        <div className="text-center py-10 text-muted-foreground">
          {t("admin.no_custom_options_global")}
        </div>
      )}
    </div>
  );
}

function FeedbackManagement() {
  useLocale();
  const { toast } = useToast();
  const { data: allFeedback, isLoading } = useAdminFeedback();
  const { mutate: deleteFeedback, isPending: isDeleting } = useDeleteFeedback();

  const handleDelete = (id: number) => {
    deleteFeedback(id, {
      onSuccess: () => toast({ title: t("admin.feedback_deleted") }),
      onError: () => toast({ title: t("admin.feedback_delete_failed"), variant: "destructive" }),
    });
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "board":
        return <Badge className="bg-blue-600 text-white">{t("admin.feedback_category_board")}</Badge>;
      case "software":
        return <Badge className="bg-purple-600 text-white">{t("admin.feedback_category_software")}</Badge>;
      case "other":
        return <Badge variant="secondary">{t("admin.feedback_category_other")}</Badge>;
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-card/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("admin.feedback_management")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.feedback_description")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("admin.feedback_count", { count: allFeedback?.length || 0 })}
        </p>
      </div>

      {allFeedback?.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {t("admin.no_feedback")}
        </div>
      ) : (
        <div className="space-y-4">
          {allFeedback?.map((fb) => (
            <Card key={fb.id} className="bg-card border-white/10" data-testid={`card-feedback-${fb.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(fb.category)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {fb.name ? (
                        <span className="flex items-center gap-1">
                          <UserCircle className="w-3 h-3" />
                          {t("admin.feedback_from", { name: fb.name })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserCircle className="w-3 h-3" />
                          {t("admin.feedback_anonymous")}
                        </span>
                      )}
                      {fb.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {t("admin.feedback_email", { email: fb.email })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(fb.id)}
                    disabled={isDeleting}
                    data-testid={`button-delete-feedback-${fb.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
