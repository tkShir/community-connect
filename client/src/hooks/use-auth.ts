import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeout);
    // Treat a timeout as "not authenticated" rather than a hard error
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("Auth check timed out — treating user as unauthenticated");
      return null;
    }
    throw err;
  }
}

async function logout(): Promise<void> {
  window.location.href = "/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
