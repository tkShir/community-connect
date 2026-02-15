import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OfficialContent } from "@shared/schema";

export function useOfficialContent() {
  return useQuery<OfficialContent[]>({
    queryKey: ["/api/official"],
  });
}

export function useUpdateOfficialContent() {
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest("PUT", `/api/official/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official"] });
    },
  });
}
