import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type InsertProfile } from "@shared/schema";
import { useUpdateProfile, useMyProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TagInput } from "@/components/TagInput";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { z } from "zod";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import {
  PROFESSION_KEYS,
  CAREER_STATUS_KEYS,
  INTEREST_KEYS,
  HOBBY_KEYS,
  AGE_RANGE_KEYS,
  CONTACT_METHOD_KEYS,
  buildOptions,
  buildCustomOptions,
  migrateToKey,
  migrateArrayToKeys,
} from "@/lib/profile-options";
import { useCustomOptions, useCreateCustomOption } from "@/hooks/use-custom-options";

const formSchema = insertProfileSchema.extend({
  alias: z.string().min(1, t("onboarding.alias_required")).min(2, t("onboarding.alias_min_length")),
  profession: z.array(z.string()).min(1, t("onboarding.select_profession")),
  careerStatus: z.string().min(1, t("onboarding.select_career_status")),
  interests: z.array(z.string()).min(1, t("onboarding.select_interest")),
  hobbies: z.array(z.string()).min(1, t("onboarding.select_hobby")),
  goal: z.array(z.string()).optional().default([]),
});

type FormData = z.infer<typeof formSchema>;

export default function Onboarding() {
  useLocale();

  const { user } = useAuth();
  const { data: existingProfile } = useMyProfile();
  const { mutate, isPending } = useUpdateProfile();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { refetch: refetchCustomOptions } = useCustomOptions(); // populate custom options cache
  const { mutate: createCustomOption, isPending: isCreatingOption } = useCreateCustomOption();

  // Add new profession dialog state
  const [showAddProfessionDialog, setShowAddProfessionDialog] = useState(false);
  const [newProfessionJa, setNewProfessionJa] = useState("");
  const [newProfessionEn, setNewProfessionEn] = useState("");

  const professionOptions = [...buildOptions(PROFESSION_KEYS), ...buildCustomOptions("profession")];
  const careerStatusOptions = buildOptions(CAREER_STATUS_KEYS);
  const interestOptions = [...buildOptions(INTEREST_KEYS), ...buildCustomOptions("interests")];
  const hobbyOptions = [...buildOptions(HOBBY_KEYS), ...buildCustomOptions("hobbies")];
  const ageRangeOptions = buildOptions(AGE_RANGE_KEYS);
  const contactMethodOptions = buildOptions(CONTACT_METHOD_KEYS);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alias: "",
      bio: "",
      profession: [],
      hobbies: [],
      interests: [],
      careerStatus: "",
      isPublic: true,
      ageRange: "",
      contactMethod: "",
      contactValue: "",
      goal: [],
    },
  });

  useEffect(() => {
    if (existingProfile) {
      form.reset({
        alias: existingProfile.alias,
        bio: existingProfile.bio,
        profession: migrateArrayToKeys(
          Array.isArray(existingProfile.profession) ? existingProfile.profession : [existingProfile.profession]
        ),
        hobbies: migrateArrayToKeys(existingProfile.hobbies),
        interests: migrateArrayToKeys(existingProfile.interests),
        careerStatus: existingProfile.careerStatus ?? "career_other",
        isPublic: existingProfile.isPublic,
        ageRange: migrateToKey(existingProfile.ageRange),
        contactMethod: migrateToKey(existingProfile.contactMethod),
        contactValue: existingProfile.contactValue,
        goal: existingProfile.goal ?? [],
      });
    }
  }, [existingProfile, form]);

  const onSubmit = (data: FormData) => {
    const isFirstProfile = !existingProfile;
    mutate(data as InsertProfile, {
      onSuccess: async () => {
        await queryClient.refetchQueries({ queryKey: [api.profiles.me.path] });
        if (isFirstProfile) {
          setLocation("/discover");
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-white/10 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-2xl">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <CardTitle className="text-3xl font-display font-bold">
            {existingProfile
              ? t("onboarding.edit_profile")
              : t("onboarding.create_persona")}
          </CardTitle>
          <CardDescription className="text-lg">
            {t("onboarding.profile_visibility_note")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="alias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("onboarding.alias_label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("onboarding.alias_placeholder")}
                          {...field}
                          className="bg-background border-white/10"
                          data-testid="input-alias"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("onboarding.age_range")}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-white/10" data-testid="select-age-range">
                            <SelectValue
                              placeholder={t("onboarding.select_age_range")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ageRangeOptions.map((opt) => (
                            <SelectItem key={opt.key} value={opt.key}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="careerStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("onboarding.career_status_label")}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-white/10" data-testid="select-career-status">
                          <SelectValue placeholder={t("onboarding.select_career_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {careerStatusOptions.map((opt) => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("onboarding.profession_label")}
                    </FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        options={professionOptions}
                        placeholder={t("onboarding.profession_placeholder")}
                        data-testid="input-profession"
                        addNewLabel={t("onboarding.profession_add_new")}
                        onAddNew={() => {
                          setNewProfessionJa("");
                          setNewProfessionEn("");
                          setShowAddProfessionDialog(true);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      {t("onboarding.profession_help")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("onboarding.bio_label")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("onboarding.bio_placeholder")}
                        className="bg-background border-white/10 resize-none min-h-[100px]"
                        {...field}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                      {t("onboarding.interests_label")}
                    </FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          options={interestOptions}
                          placeholder={t("onboarding.interests_placeholder")}
                          data-testid="input-interests"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hobbies"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                      {t("onboarding.hobbies_label")}
                    </FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          options={hobbyOptions}
                          placeholder={t("onboarding.hobbies_placeholder")}
                          data-testid="input-hobbies"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-white/10 pt-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {t("onboarding.contact_information")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.contact_shared_note")}
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactMethod"
                    render={({ field }) => (
                      <FormItem>
                    <FormLabel>
                      {t("onboarding.preferred_contact_method")}
                    </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger
                              className="bg-background border-white/10"
                              data-testid="select-contact-method"
                            >
                              <SelectValue
                                placeholder={t("onboarding.select_method")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contactMethodOptions.map((opt) => (
                              <SelectItem key={opt.key} value={opt.key}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactValue"
                    render={({ field }) => (
                      <FormItem>
                    <FormLabel>
                      {t("onboarding.contact_info")}
                    </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("onboarding.contact_placeholder")}
                            {...field}
                            className="bg-background border-white/10"
                            data-testid="input-contact-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isPending}
                  data-testid="button-submit-profile"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("onboarding.saving")}
                    </>
                  ) : existingProfile ? (
                    t("onboarding.save_changes")
                  ) : (
                    t("onboarding.enter_community")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Add new profession dialog */}
      <Dialog open={showAddProfessionDialog} onOpenChange={setShowAddProfessionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("onboarding.profession_add_new_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("onboarding.profession_add_new_ja")}</label>
              <Input
                value={newProfessionJa}
                onChange={(e) => setNewProfessionJa(e.target.value)}
                placeholder={t("onboarding.profession_add_new_ja_placeholder")}
                className="bg-background border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("onboarding.profession_add_new_en")}</label>
              <Input
                value={newProfessionEn}
                onChange={(e) => setNewProfessionEn(e.target.value)}
                placeholder={t("onboarding.profession_add_new_en_placeholder")}
                className="bg-background border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddProfessionDialog(false)}
            >
              {t("events.cancel")}
            </Button>
            <Button
              type="button"
              disabled={!newProfessionJa.trim() || !newProfessionEn.trim() || isCreatingOption}
              onClick={() => {
                createCustomOption(
                  { category: "profession", labelJa: newProfessionJa.trim(), labelEn: newProfessionEn.trim() },
                  {
                    onSuccess: async (option) => {
                      // Refresh cache so new option appears in the dropdown
                      await refetchCustomOptions();
                      // Auto-select the newly created option
                      const current = form.getValues("profession") || [];
                      if (!current.includes(option.originalValue)) {
                        form.setValue("profession", [...current, option.originalValue]);
                      }
                      setShowAddProfessionDialog(false);
                    },
                  }
                );
              }}
            >
              {isCreatingOption ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("onboarding.saving")}</>
              ) : (
                t("onboarding.add_option")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
