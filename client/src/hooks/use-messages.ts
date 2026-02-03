import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// GET /api/matches/:matchId/messages
export function useMessages(matchId: number) {
  return useQuery({
    queryKey: [api.messages.list.path, matchId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { matchId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!matchId,
    refetchInterval: 3000, // Polling every 3s for MVP
  });
}

// POST /api/matches/:matchId/messages
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ matchId, content }: { matchId: number; content: string }) => {
      const url = buildUrl(api.messages.create.path, { matchId });
      const res = await fetch(url, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, variables.matchId] });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
}
