import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logout } from "../slices/authSlice";
import { createRobustFetch, logFetchDebugInfo } from "../../utils/fetchDebug";

// Preserve original fetch before any third-party libraries can override it
if (
  typeof globalThis !== "undefined" &&
  globalThis.fetch &&
  !(globalThis as any).__originalFetch
) {
  (globalThis as any).__originalFetch = globalThis.fetch;
}
if (
  typeof window !== "undefined" &&
  window.fetch &&
  !(globalThis as any).__originalFetch
) {
  (globalThis as any).__originalFetch = window.fetch;
}

// Log fetch environment info for debugging
if (process.env.NODE_ENV === "development") {
  logFetchDebugInfo();
}

// Note: Using completely custom fetch implementation below to avoid RTK Query response body conflicts

// Use standard fetchBaseQuery for reliability
const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state?.auth?.token || localStorage.getItem("token");

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
  timeout: 15000,
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 errors
  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    const isAuthEndpoint =
      url.includes("auth/login") || url.includes("auth/register");

    if (!isAuthEndpoint) {
      localStorage.removeItem("token");
      setTimeout(() => {
        try {
          api.dispatch(logout());
        } catch (err) {
          console.warn("Error dispatching logout:", err);
        }
      }, 0);
    }
  }

  // Normalize standardized API shape: if success === false, treat as error
  if (result.data) {
    const data = result.data as any;
    if (data && typeof data === "object" && "success" in data) {
      if (data.success === false) {
        // Convert to error
        const errorObj: FetchBaseQueryError = {
          status: result.meta?.response?.status || 200,
          data: data,
        } as any;

        // Show toast for errors
        try {
          // Dynamic import to avoid circular dependencies
          const { toast } = await import("../../hooks/use-toast");
          const { getFriendlyApiMessage } = await import(
            "../../lib/apiHandler"
          );
          const msg = getFriendlyApiMessage({ status: errorObj.status, data });
          toast({
            title: "Request failed",
            description: msg,
            variant: "destructive",
          });
        } catch (e) {
          // Ignore toast errors
        }

        return { error: errorObj };
      }
    }
  }

  // Handle network errors or other failures
  if (result.error) {
    try {
      const { toast } = await import("../../hooks/use-toast");
      const { getFriendlyApiMessage } = await import("../../lib/apiHandler");
      const msg = getFriendlyApiMessage(result.error);
      toast({
        title: "Request failed",
        description: msg,
        variant: "destructive",
      });
    } catch (e) {
      // Ignore toast errors
    }
  }

  return result;
};

// Create the base API slice
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Complaint",
    "ComplaintType",
    "Ward",
    "Analytics",
    "Report",
    "Notification",
    "SystemConfig",
    "Material",
    "Photo",
    "ServiceRequest",
    "ServiceType",
  ],
  endpoints: () => ({}),
});

// Export hooks
export const {
  // Will be populated by individual API slices
} = baseApi;

// Types for enhanced error handling
export interface ApiError {
  status: number;
  message: string;
  field?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Note: transformResponse functions were removed to prevent "Response body is already used" errors
// in RTK Query. The backend now returns ApiResponse<T> format directly.

// Helper for handling optimistic updates
export const optimisticUpdate = <T>(
  items: T[],
  updatedItem: Partial<T> & { id: string },
  idField: keyof T = "id" as keyof T,
): T[] => {
  return items.map((item) =>
    item[idField] === updatedItem.id ? { ...item, ...updatedItem } : item,
  );
};

// Helper for handling pessimistic updates (rollback on error)
export const rollbackUpdate = <T>(
  items: T[],
  originalItem: T,
  idField: keyof T = "id" as keyof T,
): T[] => {
  return items.map((item) =>
    item[idField] === originalItem[idField] ? originalItem : item,
  );
};

// Helper to extract error message from RTK Query error - defensive implementation
export const getApiErrorMessage = (error: any): string => {
  try {
    console.log("getApiErrorMessage received error:", error);

    // First, try to get the actual error message from the response data
    if (error?.data?.message) {
      return error.data.message;
    }

    // Try to get error message from different possible structures
    if (error?.data?.error) {
      return typeof error.data.error === "string"
        ? error.data.error
        : "An error occurred";
    }

    // Handle RTK Query error formats
    if (error?.message) {
      return error.message;
    }

    // Handle serialized error responses
    if (typeof error?.data === "string") {
      try {
        const parsedError = JSON.parse(error.data);
        if (parsedError.message) {
          return parsedError.message;
        }
      } catch {
        // If parsing fails, return the string as is
        return error.data;
      }
    }

    // Handle status-based errors as fallback
    if (error?.status) {
      switch (error.status) {
        case 400:
          return "Bad request - please check your input";
        case 401:
          return "Unauthorized - please login again";
        case 403:
          return "Forbidden - you do not have permission";
        case 404:
          return "Resource not found";
        case 409:
          return "Conflict - resource already exists";
        case 422:
          return "Validation error - please check your input";
        case 429:
          return "Too many requests - please try again later";
        case 500:
          return "Internal server error - please try again later";
        default:
          return `An error occurred (${error.status})`;
      }
    }

    // Handle network errors
    if (
      error?.message?.includes("Failed to fetch") ||
      error?.status === "NETWORK_ERROR"
    ) {
      return "Cannot connect to the server. Please check your internet connection and try again.";
    }

    if (error?.status === "TIMEOUT_ERROR") {
      return "Request timed out. Please try again.";
    }

    if (error?.status === "CONNECTION_ERROR") {
      return "Network connection error. Please check your connection and try again.";
    }

    if (error?.status === "FETCH_ERROR") {
      return "Network request failed. Please try again.";
    }

    // Handle other error types
    if (error?.error) {
      return "Network error - please check your connection";
    }

    return "An unexpected error occurred. Please try again.";
  } catch (err) {
    console.warn("Error in getApiErrorMessage:", err);
    return "An unexpected error occurred. Please try again.";
  }
};
