import { createFileRoute } from "@tanstack/react-router"

import { FeaturePlaceholder } from "@/components/feature-placeholder"
import { createPageMeta } from "@/lib/page-meta"

export const Route = createFileRoute("/_authenticated/$organizationSlug/")({
  head: () => ({
    meta: createPageMeta({
      title: "Dashboard",
      description: "View and manage your OpenStream workspace.",
    }),
  }),
  component: () => <FeaturePlaceholder titleKey="navigation.dashboard" />,
})
