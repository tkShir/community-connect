import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, InsertEvent } from "@shared/schema";

export type EventWithCreator = Event & {
  creatorAlias: string | null;
  creatorContactMethod: string | null;
  creatorContactValue: string | null;
  creatorIsAdmin: boolean;
};

export function usePublishedEvents() {
  return useQuery<EventWithCreator[]>({
    queryKey: ["/api/events"],
  });
}

export function useMyEvents() {
  return useQuery<Event[]>({
    queryKey: ["/api/events/mine"],
  });
}

export function useEvent(id: number) {
  return useQuery<Event>({
    queryKey: ["/api/events", id],
    enabled: !!id,
  });
}

export function useCreateEvent() {
  return useMutation({
    mutationFn: async (event: InsertEvent) => {
      const response = await apiRequest("POST", "/api/events", event);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine"] });
    },
  });
}

export function useAdminEvents() {
  return useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });
}

export function usePendingEvents() {
  return useQuery<Event[]>({
    queryKey: ["/api/admin/events/pending"],
  });
}

export function useApproveEvent() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/events/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });
}

export function useDenyEvent() {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/events/${id}/deny`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events/pending"] });
    },
  });
}

export function useUpdateEvent() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEvent> }) => {
      const response = await apiRequest("PATCH", `/api/admin/events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });
}

export function useDeleteEvent() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/events/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });
}
