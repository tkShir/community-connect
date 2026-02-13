import { useState } from "react";
import { usePublishedEvents, useMyEvents, useCreateEvent, type EventWithCreator } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Plus, CalendarCheck, AlertCircle, Send, UserCheck, Shield, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { translateOptionKey } from "@/lib/profile-options";

const eventFormSchema = z.object({
  title: z
    .string()
    .min(3, t("events.title_min_length")),
  description: z
    .string()
    .min(1, t("events.description_required")),
  eventDate: z.string().min(1, t("events.date_required")),
  eventTime: z.string().min(1, t("events.time_required")),
  location: z.string().min(1, t("events.location_required")),
  schedule: z.string().optional(),
  googleFormLink: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function Events() {
  useLocale();
  const { data: publishedEvents, isLoading: loadingPublished } = usePublishedEvents();
  const { data: myEvents, isLoading: loadingMine } = useMyEvents();
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contactDialogEvent, setContactDialogEvent] = useState<EventWithCreator | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      eventDate: "",
      eventTime: "",
      location: "",
      schedule: "",
      googleFormLink: "",
    },
  });

  const onSubmit = (data: EventFormValues) => {
    createEvent(
      {
        ...data,
        eventDate: new Date(data.eventDate),
        schedule: data.schedule || null,
        googleFormLink: data.googleFormLink || null,
      },
      {
        onSuccess: () => {
          toast({
            title: t("events.event_submitted"),
            description: t("events.event_submitted_description"),
          });
          form.reset();
          setIsDialogOpen(false);
        },
        onError: (error: any) => {
          toast({
            title: t("events.error"),
            description:
              error.message ||
              t("events.failed_to_submit"),
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-600 text-white">
            {t("events.published")}
          </Badge>
        );
      case "pending_approval":
        return (
          <Badge className="bg-yellow-600 text-white">
            {t("events.pending_approval")}
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            {t("events.denied")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleParticipate = (event: EventWithCreator) => {
    if (event.googleFormLink) {
      window.open(event.googleFormLink, "_blank", "noopener,noreferrer");
    } else {
      setContactDialogEvent(event);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loadingPublished) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">
            {t("events.events")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("events.discover_events")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-propose-event">
              <Plus className="w-4 h-4 mr-2" />
              {t("events.propose_event")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {t("events.propose_new_event")}
              </DialogTitle>
              <DialogDescription>
                {t("events.submit_for_approval")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("events.event_title")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("events.event_title_placeholder")}
                          data-testid="input-event-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("events.description")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("events.description_placeholder")}
                          data-testid="input-event-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("events.date")}</FormLabel>
                        <FormControl>
                          <Input type="date" data-testid="input-event-date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="eventTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("events.time")}</FormLabel>
                        <FormControl>
                          <Input type="time" data-testid="input-event-time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("events.location")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("events.location_placeholder")}
                          data-testid="input-event-location"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("events.schedule_optional")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("events.schedule_checkin")
                            .concat("\n")
                            .concat(
                              t("events.schedule_networking")
                            )
                            .concat("\n")
                            .concat(
                              t("events.schedule_speaker")
                            )}
                          data-testid="input-event-schedule"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="googleFormLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("events.google_form_link")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("events.google_form_link_placeholder")}
                          data-testid="input-event-google-form"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    data-testid="button-submit-event"
                  >
                    {isCreating
                      ? t("events.submitting")
                      : t("events.submit_for_review")}
                    {!isCreating && <Send className="w-4 h-4 ml-2" />}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="upcoming" data-testid="tab-upcoming-events">
            <CalendarCheck className="w-4 h-4 mr-2" />
            {t("events.upcoming_events")}
          </TabsTrigger>
          <TabsTrigger value="my-events" data-testid="tab-my-events">
            <Calendar className="w-4 h-4 mr-2" />
            {t("events.my_submissions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {!publishedEvents || publishedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center px-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">{t("events.no_events")}</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                {t("events.be_first_to_propose")}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("events.propose_event")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence>
                {publishedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:border-primary/30 transition-colors" data-testid={`card-event-${event.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {event.createdByAdmin ? (
                                <Badge className="bg-blue-600 text-white">
                                  <Shield className="w-3 h-3 mr-1" />
                                  {t("events.official_event")}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600 text-white">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {t("events.member_proposed_event")}
                                </Badge>
                              )}
                              {!event.createdByAdmin && event.creatorAlias && (
                                <span className="text-sm text-muted-foreground">
                                  {t("events.proposed_by", { name: event.creatorAlias })}
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-xl">{event.title}</CardTitle>
                            <CardDescription className="mt-2">{event.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {formatDate(event.eventDate)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            {event.eventTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {event.location}
                          </div>
                        </div>
                        {event.schedule && (
                          <div className="bg-secondary/30 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">{t("events.schedule")}</p>
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{event.schedule}</pre>
                          </div>
                        )}
                        <div className="pt-2">
                          <Button onClick={() => handleParticipate(event)} data-testid={`button-participate-${event.id}`}>
                            {event.googleFormLink ? (
                              <ExternalLink className="w-4 h-4 mr-2" />
                            ) : null}
                            {t("events.participate")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-events" className="mt-6">
          {loadingMine ? (
            <div className="space-y-4">
              <Skeleton className="h-[150px] w-full rounded-2xl" />
              <Skeleton className="h-[150px] w-full rounded-2xl" />
            </div>
          ) : !myEvents || myEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center px-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Send className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">{t("events.no_submissions")}</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                {t("events.no_submissions_message")}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("events.propose_event")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence>
                {myEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:border-primary/30 transition-colors" data-testid={`card-my-event-${event.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <CardTitle className="text-xl">{event.title}</CardTitle>
                            <CardDescription className="mt-2">{event.description}</CardDescription>
                          </div>
                          {getStatusBadge(event.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {formatDate(event.eventDate)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            {event.eventTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {event.location}
                          </div>
                        </div>
                        {event.status === "denied" && event.denialReason && (
                          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-destructive">{t("events.denial_reason")}</p>
                              <p className="text-sm text-muted-foreground">{event.denialReason}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!contactDialogEvent} onOpenChange={(open) => !open && setContactDialogEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("events.contact_info_title")}</DialogTitle>
            <DialogDescription>{t("events.contact_info_description")}</DialogDescription>
          </DialogHeader>
          {contactDialogEvent && (
            <div className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">{t("events.contact_method_label")}</p>
                <p className="text-sm text-muted-foreground">
                  {translateOptionKey(contactDialogEvent.creatorContactMethod || "")}
                </p>
                <p className="text-lg font-semibold">
                  {contactDialogEvent.creatorContactValue}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setContactDialogEvent(null)}>
                  {t("events.close")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
