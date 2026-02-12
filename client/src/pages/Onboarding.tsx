import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type InsertProfile } from "@shared/schema";
import { useUpdateProfile, useMyProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/TagInput";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { z } from "zod";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

const formSchema = insertProfileSchema.extend({
  alias: z.string().min(1, t("onboarding.alias_required")).min(2, t("onboarding.alias_min_length")),
  profession: z.array(z.string()).min(1, t("onboarding.select_profession")),
  goal: z.array(z.string()).min(1, t("onboarding.select_goal")),
  interests: z.array(z.string()).min(1, t("onboarding.select_interest")),
  hobbies: z.array(z.string()).min(1, t("onboarding.select_hobby")),
});

type FormData = z.infer<typeof formSchema>;

export default function Onboarding() {
  useLocale();

  const { user } = useAuth();
  const { data: existingProfile } = useMyProfile();
  const { mutate, isPending } = useUpdateProfile();
  const [, setLocation] = useLocation();

  const PROFESSIONS = [
    t("onboarding.technology"),
    t("onboarding.finance"),
    t("onboarding.consulting"),
    t("onboarding.healthcare"),
    t("onboarding.education"),
    t("onboarding.arts"),
    t("onboarding.engineering"),
    t("onboarding.law"),
    t("onboarding.marketing"),
    t("onboarding.real_estate"),
  ];

  const GOALS = [
    { value: "mentor", label: t("onboarding.find_mentor") },
    { value: "mentee", label: t("onboarding.find_mentee") },
    { value: "networking", label: t("onboarding.professional_networking") },
    { value: "friendship", label: t("onboarding.friendship_social") },
    { value: "activity_partner", label: t("onboarding.activity_partner") },
  ];

  const INTERESTS = [
    t("onboarding.ai"),
    t("onboarding.startups"),
    t("onboarding.investing"),
    t("onboarding.ux_design"),
    t("onboarding.data_science"),
    t("onboarding.product_management"),
    t("onboarding.growth_hacking"),
    t("onboarding.blockchain"),
    t("onboarding.sustainability"),
    t("onboarding.leadership"),
  ];

  const HOBBIES = [
    t("onboarding.soccer"),
    t("onboarding.tennis"),
    t("onboarding.reading"),
    t("onboarding.hiking"),
    t("onboarding.cooking"),
    t("onboarding.photography"),
    t("onboarding.traveling"),
    t("onboarding.yoga"),
    t("onboarding.gaming"),
    t("onboarding.painting"),
  ];

  const AGE_RANGES = [
    t("onboarding.age_below_18"),
    t("onboarding.age_18_22"),
    t("onboarding.age_23_26"),
    t("onboarding.age_27_30"),
    t("onboarding.age_30_34"),
    t("onboarding.age_above_34"),
  ];

  const CONTACT_METHODS = [
    t("onboarding.phone"),
    t("onboarding.email"),
    t("onboarding.line"),
  ];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alias: "",
      bio: "",
      profession: [],
      hobbies: [],
      interests: [],
      goal: [],
      isPublic: true,
      ageRange: "",
      contactMethod: "",
      contactValue: "",
    },
  });

  useEffect(() => {
    if (existingProfile) {
      form.reset({
        alias: existingProfile.alias,
        bio: existingProfile.bio,
        profession: Array.isArray(existingProfile.profession) ? existingProfile.profession : [existingProfile.profession],
        hobbies: existingProfile.hobbies,
        interests: existingProfile.interests,
        goal: Array.isArray(existingProfile.goal) ? existingProfile.goal : [existingProfile.goal],
        isPublic: existingProfile.isPublic,
        ageRange: existingProfile.ageRange,
        contactMethod: existingProfile.contactMethod,
        contactValue: existingProfile.contactValue,
      });
    }
  }, [existingProfile, form]);

  const onSubmit = (data: FormData) => {
    mutate(data as InsertProfile, {
      onSuccess: () => {
        setTimeout(() => {
          setLocation("/discover");
        }, 100);
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
                          {AGE_RANGES.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
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
                        suggestions={PROFESSIONS}
                        placeholder={t("onboarding.profession_placeholder")}
                        data-testid="input-profession"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("onboarding.goals_label")}
                    </FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        suggestions={GOALS.map((g) => g.label)}
                        placeholder={t("onboarding.goals_placeholder")}
                        data-testid="input-goal"
                      />
                    </FormControl>
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
                          suggestions={INTERESTS}
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
                          suggestions={HOBBIES}
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
                            {CONTACT_METHODS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
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
    </div>
  );
}
