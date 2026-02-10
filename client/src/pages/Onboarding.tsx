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

const PROFESSIONS = [
  "テクノロジー",
  "金融",
  "コンサルティング",
  "医療・ヘルスケア",
  "教育",
  "アート",
  "エンジニアリング",
  "法律",
  "マーケティング",
  "不動産",
];

const GOALS = [
  { value: "mentor", label: "メンターを探す" },
  { value: "mentee", label: "メンティーを探す" },
  { value: "networking", label: "ビジネス交流" },
  { value: "friendship", label: "友人・交流" },
  { value: "activity_partner", label: "一緒に活動する相手" },
];

const INTERESTS = [
  "AI",
  "スタートアップ",
  "投資",
  "UXデザイン",
  "データサイエンス",
  "プロダクトマネジメント",
  "グロースハック",
  "ブロックチェーン",
  "サステナビリティ",
  "リーダーシップ",
];

const HOBBIES = [
  "サッカー",
  "テニス",
  "読書",
  "ハイキング",
  "料理",
  "写真",
  "旅行",
  "ヨガ",
  "ゲーム",
  "絵画",
];

const AGE_RANGES = [
  "18歳未満",
  "18〜22歳",
  "23〜26歳",
  "27〜30歳",
  "30〜34歳",
  "35歳以上",
];

const CONTACT_METHODS = ["電話", "メール", "LINE"];

const formSchema = insertProfileSchema.extend({
  alias: z.string().min(1, "Alias is required").min(2, "Alias must be at least 2 characters"),
  profession: z.array(z.string()).min(1, "Select at least one profession"),
  goal: z.array(z.string()).min(1, "Select at least one goal"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  hobbies: z.array(z.string()).min(1, "Select at least one hobby"),
});

type FormData = z.infer<typeof formSchema>;

export default function Onboarding() {
  const { user } = useAuth();
  const { data: existingProfile } = useMyProfile();
  const { mutate, isPending } = useUpdateProfile();
  const [, setLocation] = useLocation();

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
              ? t("client/src/pages/Onboarding.tsx", "Edit Your Profile")
              : t("client/src/pages/Onboarding.tsx", "Create Your Persona")}
          </CardTitle>
          <CardDescription className="text-lg">
            {t(
              "client/src/pages/Onboarding.tsx",
              "This information will be visible to others. Keep it professional yet authentic."
            )}
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
                        {t("client/src/pages/Onboarding.tsx", "Alias (Anonymous Name)")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "client/src/pages/Onboarding.tsx",
                            "e.g. Maverick, Strategist..."
                          )}
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
                        {t("client/src/pages/Onboarding.tsx", "Age Range")}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-white/10" data-testid="select-age-range">
                            <SelectValue
                              placeholder={t(
                                "client/src/pages/Onboarding.tsx",
                                "Select age range"
                              )}
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
                      {t(
                        "client/src/pages/Onboarding.tsx",
                        "Profession / Industry (select at least 1)"
                      )}
                    </FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        suggestions={PROFESSIONS}
                        placeholder={t(
                          "client/src/pages/Onboarding.tsx",
                          "Select or type professions"
                        )}
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
                      {t(
                        "client/src/pages/Onboarding.tsx",
                        "What are you looking for? (select at least 1)"
                      )}
                    </FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        suggestions={GOALS.map((g) => g.label)}
                        placeholder={t(
                          "client/src/pages/Onboarding.tsx",
                          "Select or type your goals"
                        )}
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
                      {t("client/src/pages/Onboarding.tsx", 'Bio (The "Why")')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          "client/src/pages/Onboarding.tsx",
                          "Share a bit about yourself..."
                        )}
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
                      {t(
                        "client/src/pages/Onboarding.tsx",
                        "Professional Interests (select at least 1)"
                      )}
                    </FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          suggestions={INTERESTS}
                        placeholder={t(
                          "client/src/pages/Onboarding.tsx",
                          "Select or type interests"
                        )}
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
                      {t(
                        "client/src/pages/Onboarding.tsx",
                        "Hobbies & Passions (select at least 1)"
                      )}
                    </FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          suggestions={HOBBIES}
                        placeholder={t(
                          "client/src/pages/Onboarding.tsx",
                          "Select or type hobbies"
                        )}
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
                  {t("client/src/pages/Onboarding.tsx", "Contact Information")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "client/src/pages/Onboarding.tsx",
                    "This will be shared with your accepted connections."
                  )}
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactMethod"
                    render={({ field }) => (
                      <FormItem>
                    <FormLabel>
                      {t("client/src/pages/Onboarding.tsx", "Preferred Contact Method")}
                    </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger
                              className="bg-background border-white/10"
                              data-testid="select-contact-method"
                            >
                              <SelectValue
                                placeholder={t(
                                  "client/src/pages/Onboarding.tsx",
                                  "Select method"
                                )}
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
                      {t("client/src/pages/Onboarding.tsx", "Contact Info")}
                    </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "client/src/pages/Onboarding.tsx",
                              "Your phone, email, or LINE ID"
                            )}
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
                      {t("client/src/pages/Onboarding.tsx", "Saving...")}
                    </>
                  ) : existingProfile ? (
                    t("client/src/pages/Onboarding.tsx", "Save Changes")
                  ) : (
                    t("client/src/pages/Onboarding.tsx", "Enter the Community")
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
