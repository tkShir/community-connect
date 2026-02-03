import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// GET /api/profiles/me
export function useMyProfile() {
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.me.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

// GET /api/profiles/:id
export function useUserProfile(id: number) {
  return useQuery({
    queryKey: [api.profiles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.profiles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return api.profiles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/profiles (Upsert)
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProfile) => {
      const validated = api.profiles.upsert.input.parse(data);
      const res = await fetch(api.profiles.upsert.path, {
        method: api.profiles.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.profiles.upsert.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update profile");
      }
      return api.profiles.upsert.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
