import { useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * A custom hook that provides an authenticated fetch client.
 * It automatically attaches the Clerk JWT Bearer token to requests.
 */
export function useApiClient() {
  const { getToken } = useAuth();

  const authenticatedFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      // Get the Clerk JWT token
      const token = await getToken();

      // Set up headers, ensuring Authorization is included
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // Default to application/json if not set and method is not GET/HEAD
      if (
        !headers.has("Content-Type") &&
        options.method &&
        !["GET", "HEAD"].includes(options.method.toUpperCase())
      ) {
        // Note: If sending FormData, do NOT set Content-Type to application/json
        if (!(options.body instanceof FormData)) {
          headers.set("Content-Type", "application/json");
        }
      }

      // Merge options
      const config: RequestInit = {
        ...options,
        headers,
      };

      // Construct full URL
      const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

      // Execute request
      const response = await fetch(url, config);

      return response;
    },
    [getToken],
  );

  return useMemo(
    () => ({
      fetch: authenticatedFetch,
      baseUrl: API_BASE_URL,
    }),
    [authenticatedFetch],
  );
}
