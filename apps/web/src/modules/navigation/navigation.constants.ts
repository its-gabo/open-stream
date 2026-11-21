import {
  AudioLinesIcon,
  DatabaseIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  SettingsIcon,
} from "lucide-react"

/** Sections of an organization; storages, transcription and activity are shown to its owner only. */
export const APP_NAVIGATION = [
  {
    to: "/$organizationSlug",
    path: "",
    labelKey: "navigation.dashboard",
    icon: LayoutDashboardIcon,
    isOwnerOnly: false,
  },
  {
    to: "/$organizationSlug/libraries",
    path: "libraries",
    labelKey: "navigation.libraries",
    icon: LibraryBigIcon,
    isOwnerOnly: false,
  },
  {
    to: "/$organizationSlug/storages",
    path: "storages",
    labelKey: "navigation.storages",
    icon: DatabaseIcon,
    isOwnerOnly: true,
  },
  {
    to: "/$organizationSlug/transcription",
    path: "transcription",
    labelKey: "navigation.transcription",
    icon: AudioLinesIcon,
    isOwnerOnly: true,
  },
  {
    to: "/$organizationSlug/activity",
    path: "activity",
    labelKey: "navigation.activity",
    icon: HistoryIcon,
    isOwnerOnly: true,
  },
  {
    to: "/$organizationSlug/settings/organization",
    path: "settings",
    labelKey: "navigation.settings",
    icon: SettingsIcon,
    isOwnerOnly: false,
  },
] as const

export const APP_SIDEBAR_STORAGE_KEY = "app-sidebar-storage"
