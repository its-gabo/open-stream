import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ChevronLeftIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { LIBRARY_TABS } from "../libraries.constants"
import { buildLibraryPath } from "../libraries.utils"
import { LibrarySwitcher } from "./library-switcher"

import type { Library } from "@/api/generated-api"

type LibraryHeaderProps = {
  organizationSlug: string
  library: Library
  /** Storage and API settings are owner-only. */
  isOwner: boolean
}

export function LibraryHeader({
  organizationSlug,
  library,
  isOwner,
}: LibraryHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tabs = LIBRARY_TABS.filter(
    (tab) =>
      (isOwner || !tab.isOwnerOnly) &&
      !(
        library.isStorageLocked &&
        "isHiddenOnceStorageLocked" in tab &&
        tab.isHiddenOnceStorageLocked
      )
  ).map((tab) => ({
    ...tab,
    path: buildLibraryPath(organizationSlug, library.id, tab.suffix),
  }))
  const activeTab = tabs.find((tab) => tab.path === pathname) ?? tabs[0]

  const handleTabChange = (value: unknown) => {
    const tab = tabs.find(({ path }) => path === value)

    if (tab) void navigate({ href: tab.path })
  }

  return (
    <div className="border-b">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-5">
        <Link
          to="/$organizationSlug/libraries"
          params={{ organizationSlug }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          {t("libraries.title")}
        </Link>
      </div>
      <div className="flex items-center gap-2 px-4 pt-2 sm:px-5">
        <h1 className="min-w-0">
          <LibrarySwitcher
            organizationSlug={organizationSlug}
            library={library}
            pathSuffix={activeTab.suffix}
          />
        </h1>
        <Badge variant="secondary">
          {library.storageName ??
            t(`libraries.storage_kinds.${library.storageKind}`)}
        </Badge>
      </div>
      <Tabs
        value={activeTab.path}
        onValueChange={handleTabChange}
        className="gap-0"
      >
        <TabsList
          variant="line"
          aria-label={library.name}
          className="h-11 w-full justify-start gap-5 px-4 sm:px-5"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.path}
              value={tab.path}
              className="h-full flex-none px-0"
            >
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
