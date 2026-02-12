import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomOption } from "@shared/schema";
import { setCustomOptionsCache } from "@/lib/profile-options";

const QUERY_KEY = ["/api/custom-options"];

export function useCustomOptions() {
  return useQuery<CustomOption[]>({
    queryKey: QUERY_KEY,
    select(data) {
      // Update the module-level cache whenever data is fetched
      setCustomOptionsCache(data);
      return data;
    },
  });
}

export function useAdminCustomOptions() {
  return useQuery<CustomOption[]>({
    queryKey: ["/api/admin/custom-options"],
  });
}

export function useUpdateCustomOption() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { labelEn?: string; labelJa?: string } }) => {
      const response = await apiRequest("PATCH", `/api/admin/custom-options/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-options"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCustomOption() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/custom-options/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-options"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
