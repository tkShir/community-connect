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

const PROFESSIONS = [
  "Technology",
  "Finance",
  "Consulting",
  "Healthcare",
  "Education",
  "Arts",
  "Engineering",
  "Law",
  "Marketing",
  "Real Estate",
];

const INTERESTS = [
  "AI",
  "Startups",
  "Investing",
  "UX Design",
  "Data Science",
  "Product Management",
  "Growth Hacking",
  "Blockchain",
  "Sustainability",
  "Leadership",
];

const HOBBIES = [
  "Soccer",
  "Tennis",
  "Reading",
  "Hiking",
  "Cooking",
  "Photography",
  "Traveling",
  "Yoga",
  "Gaming",
  "Painting",
];

const AGE_RANGES = [
  "below 18",
  "18-22",
  "23-26",
  "27-30",
  "30-34",
  "above 34",
];

const CONTACT_METHODS = ["Phone", "Email", "LINE"];

export default function Onboarding() {
  const { user } = useAuth();
  const { data: existingProfile } = useMyProfile();
  const { mutate, isPending } = useUpdateProfile();
  const [, setLocation] = useLocation();

  const form = useForm<InsertProfile>({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      alias: "",
      bio: "",
      profession: "",
      hobbies: [],
      interests: [],
      goal: "",
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
        profession: existingProfile.profession,
        hobbies: existingProfile.hobbies,
        interests: existingProfile.interests,
        goal: existingProfile.goal,
        isPublic: existingProfile.isPublic,
        ageRange: existingProfile.ageRange,
        contactMethod: existingProfile.contactMethod,
        contactValue: existingProfile.contactValue,
      });
    }
  }, [existingProfile, form]);

  const onSubmit = (data: InsertProfile) => {
    mutate(data, {
      onSuccess: () => {
        setLocation("/discover");
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
            {existingProfile ? "Edit Your Profile" : "Create Your Persona"}
          </CardTitle>
          <CardDescription className="text-lg">
            This information will be visible to others. Keep it professional yet authentic.
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
                      <FormLabel>Alias (Anonymous Name)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Maverick, Strategist..."
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
                      <FormLabel>Age Range</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-white/10" data-testid="select-age-range">
                            <SelectValue placeholder="Select age range" />
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
                    <FormLabel>Profession / Industry</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value ? [field.value] : []}
                        onChange={(vals) => field.onChange(vals[vals.length - 1] || "")}
                        suggestions={PROFESSIONS}
                        placeholder="Select or type your profession"
                        maxTags={1}
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
                    <FormLabel>What are you looking for?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-white/10" data-testid="select-goal">
                          <SelectValue placeholder="Select a primary goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mentor">I want to find a Mentor</SelectItem>
                        <SelectItem value="mentee">I want to find a Mentee</SelectItem>
                        <SelectItem value="networking">Professional Networking</SelectItem>
                        <SelectItem value="friendship">Friendship / Social</SelectItem>
                        <SelectItem value="activity_partner">Activity Partner (e.g. Sports)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (The "Why")</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share a bit about yourself..."
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
                      <FormLabel>Professional Interests</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          suggestions={INTERESTS}
                          placeholder="Select or type interests"
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
                      <FormLabel>Hobbies & Passions</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          suggestions={HOBBIES}
                          placeholder="Select or type hobbies"
                          data-testid="input-hobbies"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-white/10 pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <p className="text-sm text-muted-foreground">
                  This will be shared with your accepted connections.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Contact Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-white/10" data-testid="select-contact-method">
                              <SelectValue placeholder="Select method" />
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
                        <FormLabel>Contact Info</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your phone, email, or LINE ID"
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
                      Saving...
                    </>
                  ) : existingProfile ? (
                    "Save Changes"
                  ) : (
                    "Enter the Community"
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
