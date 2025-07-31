import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(url: string, method: string, data?: unknown | undefined,): Promise<Response> {
  // קבלת נתוני משתמש מ-localStorage
  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;

  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      'Authorization': user ? `Bearer ${user.id}` : '',
      'x-user-email': user?.email || '',
      'x-user-role': user?.role || '',
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // קבלת נתוני משתמש מ-localStorage
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        'Authorization': user ? `Bearer ${user.id}` : '',
        'x-user-email': user?.email || '',
        'x-user-role': user?.role || '',
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // נתונים טריים ל-60 שניות
      gcTime: 300000, // שמירת cache ל-5 דקות
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});