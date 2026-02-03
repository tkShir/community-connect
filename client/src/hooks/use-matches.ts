import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePotentialMatches() {
  return useQuery({
    queryKey: [api.matches.potential.path],
    queryFn: async () => {
      const res = await fetch(api.matches.potential.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      return api.matches.potential.responses[200].parse(await res.json());
    },
  });
}

export function useSuggestedMatches() {
  return useQuery({
    queryKey: [api.matches.suggested.path],
    queryFn: async () => {
      const res = await fetch(api.matches.suggested.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch suggested matches");
      return api.matches.suggested.responses[200].parse(await res.json());
    },
  });
}

export function useMatches() {
  return useQuery({
    queryKey: [api.matches.list.path],
    queryFn: async () => {
      const res = await fetch(api.matches.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch my matches");
      return api.matches.list.responses[200].parse(await res.json());
    },
  });
}

export function useRequestMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (receiverId: number) => {
      const res = await fetch(api.matches.create.path, {
        method: api.matches.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send match request");
      return api.matches.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.matches.potential.path] });
      queryClient.invalidateQueries({ queryKey: [api.matches.suggested.path] });
      queryClient.invalidateQueries({ queryKey: [api.matches.list.path] });
      toast({
        title: "Request Sent",
        description: "Your connection request has been sent.",
      });
    },
  });
}

export function useRespondMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) => {
      const url = buildUrl(api.matches.respond.path, { id });
      const res = await fetch(url, {
        method: api.matches.respond.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to respond to match");
      return api.matches.respond.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.matches.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: variables.status === 'accepted' ? "Connected!" : "Request Declined",
        description: variables.status === 'accepted'
          ? "You can now see each other's contact info."
          : "The request has been declined.",
        variant: variables.status === 'accepted' ? "default" : "destructive",
      });
    },
  });
}
