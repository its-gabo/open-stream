import { QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import type { QueryClient } from "@tanstack/react-query"
import type { PropsWithChildren } from "react"

type AppProvidersProps = PropsWithChildren<{
  queryClient: QueryClient
}>

export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}
