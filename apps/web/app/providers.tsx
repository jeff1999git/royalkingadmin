"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// The next-auth SessionProvider is not here on purpose: the admin and driver
// layouts each provide their own, so the home and login pages render without
// a session request.
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Mobile-friendly defaults: cache & dedupe network work.
            staleTime: 1000 * 30, // 30s
            gcTime: 1000 * 60 * 5, // 5min
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
