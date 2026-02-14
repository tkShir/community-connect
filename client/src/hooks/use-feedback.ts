import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Feedback, InsertFeedback } from "@shared/schema";

export function useCreateFeedback() {
  return useMutation({
    mutationFn: async (data: InsertFeedback) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      return response.json();
    },
  });
}

export function useAdminFeedback() {
  return useQuery<Feedback[]>({
    queryKey: ["/api/admin/feedback"],
  });
}

export function useDeleteFeedback() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/feedback/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
    },
  });
}
