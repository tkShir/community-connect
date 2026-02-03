import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type InsertProfile } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
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

export default function Onboarding() {
  const { user } = useAuth();
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
    },
  });

  const onSubmit = (data: InsertProfile) => {
    mutate(data, {
      onSuccess: () => {
        setLocation("/discover");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-white/10 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-2xl">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <CardTitle className="text-3xl font-display font-bold">Create Your Persona</CardTitle>
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
                        <Input placeholder="e.g. Maverick, Strategist, Luna..." {...field} className="bg-background border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession / Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Fintech Consultant" {...field} className="bg-background border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What are you looking for?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-white/10">
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
                        placeholder="Share a bit about yourself and what you bring to the community..." 
                        className="bg-background border-white/10 resize-none min-h-[100px]"
                        {...field} 
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
                          placeholder="Type & Enter (e.g. AI, Crypto)"
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
                          placeholder="Type & Enter (e.g. Soccer, Chess)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                      Creating Profile...
                    </>
                  ) : "Enter the Community"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
