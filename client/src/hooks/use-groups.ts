import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Group, InsertGroup } from "@shared/schema";

export function usePublishedGroups() {
  return useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });
}

export function useMyGroups() {
  return useQuery<Group[]>({
    queryKey: ["/api/groups/mine"],
  });
}

export function useSuggestGroup() {
  return useMutation({
    mutationFn: async (group: { title: string; description: string }) => {
      const response = await apiRequest("POST", "/api/groups", group);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/mine"] });
    },
  });
}

export function useAdminGroups() {
  return useQuery<Group[]>({
    queryKey: ["/api/admin/groups"],
  });
}

export function usePendingGroups() {
  return useQuery<Group[]>({
    queryKey: ["/api/admin/groups/pending"],
  });
}

export function useApproveGroup() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/groups/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}

export function useDenyGroup() {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/groups/${id}/deny`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups/pending"] });
    },
  });
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: async (group: InsertGroup) => {
      const response = await apiRequest("POST", "/api/groups", group);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}

export function useUpdateGroup() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertGroup> }) => {
      const response = await apiRequest("PATCH", `/api/admin/groups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}

export function useDeleteGroup() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/groups/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}
