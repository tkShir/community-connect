import { useState } from "react";
import { usePublishedGroups, useMyGroups, useSuggestGroup } from "@/hooks/use-groups";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UsersRound, Plus, Send, AlertCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Group } from "@shared/schema";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

const suggestFormSchema = z.object({
  title: z
    .string()
    .min(2, t("groups.title_min_length")),
  description: z
    .string()
    .min(1, t("groups.description_required")),
});

type SuggestFormValues = z.infer<typeof suggestFormSchema>;

export default function Groups() {
  useLocale();
  const { data: publishedGroups, isLoading: loadingPublished } = usePublishedGroups();
  const { data: myGroups, isLoading: loadingMine } = useMyGroups();
  const { mutate: suggestGroup, isPending: isSuggesting } = useSuggestGroup();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const form = useForm<SuggestFormValues>({
    resolver: zodResolver(suggestFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = (data: SuggestFormValues) => {
    suggestGroup(data, {
      onSuccess: () => {
        toast({
          title: t("groups.group_suggested"),
          description: t("groups.group_suggested_description"),
        });
        form.reset();
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description:
            error.message ||
            t("groups.failed_to_submit"),
          variant: "destructive",
        });
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-600 text-white">
            {t("groups.published")}
          </Badge>
        );
      case "pending_approval":
        return (
          <Badge className="bg-yellow-600 text-white">
            {t("groups.pending_approval")}
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            {t("groups.denied")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingPublished) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[120px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">
            {t("groups.groups")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("groups.join_groups_description")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-suggest-group">
              <Plus className="w-4 h-4 mr-2" />
              {t("groups.suggest_group")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {t("groups.suggest_new_group")}
              </DialogTitle>
              <DialogDescription>
                {t("groups.submit_for_approval")}
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
                        {t("groups.group_name")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("groups.group_name_placeholder")}
                          data-testid="input-group-title"
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
                        {t("groups.description")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("groups.description_placeholder")}
                          data-testid="input-group-description"
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
                    disabled={isSuggesting}
                    data-testid="button-submit-group"
                  >
                    {isSuggesting
                      ? t("groups.submitting")
                      : t("groups.submit_for_review")}
                    {!isSuggesting && <Send className="w-4 h-4 ml-2" />}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="all-groups" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="all-groups" data-testid="tab-all-groups">
            <UsersRound className="w-4 h-4 mr-2" />
            {t("groups.all_groups")}
          </TabsTrigger>
          <TabsTrigger value="my-suggestions" data-testid="tab-my-suggestions">
            <Send className="w-4 h-4 mr-2" />
            {t("groups.my_suggestions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-groups" className="mt-6">
          {!publishedGroups || publishedGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center px-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <UsersRound className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">{t("groups.no_groups")}</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                {t("groups.be_first_to_suggest")}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("groups.suggest_group")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {publishedGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="hover:border-primary/30 transition-colors cursor-pointer"
                      data-testid={`card-group-${group.id}`}
                      onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <UsersRound className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-lg">{group.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            </div>
                          </div>
                        </div>
                        {selectedGroup?.id === group.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-border"
                          >
                            {group.lineGroupLink ? (
                              <a
                                href={group.lineGroupLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button className="w-full sm:w-auto" data-testid={`button-join-group-${group.id}`}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {t("groups.join_line_group")}
                                </Button>
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {t("groups.line_link_not_available")}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-suggestions" className="mt-6">
          {loadingMine ? (
            <div className="space-y-4">
              <Skeleton className="h-[100px] w-full rounded-2xl" />
              <Skeleton className="h-[100px] w-full rounded-2xl" />
            </div>
          ) : !myGroups || myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center px-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Send className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">{t("groups.no_suggestions")}</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                {t("groups.no_suggestions_message")}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("groups.suggest_group")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {myGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-primary/30 transition-colors" data-testid={`card-my-group-${group.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <UsersRound className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-lg">{group.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            </div>
                          </div>
                          {getStatusBadge(group.status)}
                        </div>
                        {group.status === "denied" && group.denialReason && (
                          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3 mt-4">
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-destructive">{t("groups.denial_reason")}</p>
                              <p className="text-sm text-muted-foreground">{group.denialReason}</p>
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
