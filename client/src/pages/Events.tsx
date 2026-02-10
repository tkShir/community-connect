import { useState } from "react";
import { usePublishedEvents, useMyEvents, useCreateEvent } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Plus, CalendarCheck, AlertCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { t } from "@/lib/i18n";

const eventFormSchema = z.object({
  title: z
    .string()
    .min(3, t("client/src/pages/Events.tsx", "Title must be at least 3 characters")),
  description: z
    .string()
    .min(1, t("client/src/pages/Events.tsx", "Description is required")),
  eventDate: z.string().min(1, t("client/src/pages/Events.tsx", "Date is required")),
  eventTime: z.string().min(1, t("client/src/pages/Events.tsx", "Time is required")),
  location: z.string().min(1, t("client/src/pages/Events.tsx", "Location is required")),
  schedule: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function Events() {
  const { data: publishedEvents, isLoading: loadingPublished } = usePublishedEvents();
  const { data: myEvents, isLoading: loadingMine } = useMyEvents();
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      eventDate: "",
      eventTime: "",
      location: "",
      schedule: "",
    },
  });

  const onSubmit = (data: EventFormValues) => {
    createEvent(
      {
        ...data,
        eventDate: new Date(data.eventDate),
        schedule: data.schedule || null,
      },
      {
        onSuccess: () => {
          toast({
            title: t("client/src/pages/Events.tsx", "Event submitted"),
            description: t(
              "client/src/pages/Events.tsx",
              "Your event request has been submitted for review."
            ),
          });
          form.reset();
          setIsDialogOpen(false);
        },
        onError: (error: any) => {
          toast({
            title: t("client/src/pages/Events.tsx", "Error"),
            description:
              error.message ||
              t("client/src/pages/Events.tsx", "Failed to submit event"),
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
            {t("client/src/pages/Events.tsx", "Published")}
          </Badge>
        );
      case "pending_approval":
        return (
          <Badge className="bg-yellow-600 text-white">
            {t("client/src/pages/Events.tsx", "Pending Approval")}
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            {t("client/src/pages/Events.tsx", "Denied")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
            {t("client/src/pages/Events.tsx", "Events")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t(
              "client/src/pages/Events.tsx",
              "Discover and attend exclusive community events."
            )}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-propose-event">
              <Plus className="w-4 h-4 mr-2" />
              Propose an Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {t("client/src/pages/Events.tsx", "Propose a New Event")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "client/src/pages/Events.tsx",
                  "Submit your event for admin approval. Once approved, it will be visible to all members."
                )}
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
                        {t("client/src/pages/Events.tsx", "Event Title")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "client/src/pages/Events.tsx",
                            "e.g., Tech Networking Meetup"
                          )}
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
                        {t("client/src/pages/Events.tsx", "Description")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "client/src/pages/Events.tsx",
                            "Describe your event..."
                          )}
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
                        <FormLabel>{t("client/src/pages/Events.tsx", "Date")}</FormLabel>
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
                        <FormLabel>{t("client/src/pages/Events.tsx", "Time")}</FormLabel>
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
                        {t("client/src/pages/Events.tsx", "Location")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "client/src/pages/Events.tsx",
                            "e.g., Downtown Conference Center"
                          )}
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
                        {t("client/src/pages/Events.tsx", "Schedule (Optional)")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "client/src/pages/Events.tsx",
                            "6:00 PM - Check-in"
                          )
                            .concat("\n")
                            .concat(
                              t(
                                "client/src/pages/Events.tsx",
                                "6:30 PM - Networking"
                              )
                            )
                            .concat("\n")
                            .concat(
                              t("client/src/pages/Events.tsx", "7:00 PM - Speaker")
                            )}
                          data-testid="input-event-schedule"
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
                      ? t("client/src/pages/Events.tsx", "Submitting...")
                      : t("client/src/pages/Events.tsx", "Submit for Review")}
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
            Upcoming Events
          </TabsTrigger>
          <TabsTrigger value="my-events" data-testid="tab-my-events">
            <Calendar className="w-4 h-4 mr-2" />
            My Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {!publishedEvents || publishedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center px-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">No events yet</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Be the first to propose an event for the community!
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Propose an Event
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
                          <div>
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
                            <p className="text-sm font-medium mb-2">Schedule</p>
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{event.schedule}</pre>
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
              <h2 className="text-2xl font-display font-bold mb-2">No submissions yet</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                You haven't proposed any events. Start by creating one!
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Propose an Event
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
                              <p className="text-sm font-medium text-destructive">Denial Reason</p>
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
    </div>
  );
}
