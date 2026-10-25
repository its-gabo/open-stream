import { LayoutDashboardIcon, SettingsIcon } from "lucide-react"

export const APP_NAVIGATION = [
  {
    to: "/$organizationSlug",
    path: "",
    labelKey: "navigation.dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    to: "/$organizationSlug/settings/organization",
    path: "settings/organization",
    labelKey: "navigation.settings",
    icon: SettingsIcon,
  },
] as const

export const APP_SIDEBAR_STORAGE_KEY = "app-sidebar-storage"
