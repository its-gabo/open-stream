import { useLocation, useNavigate } from "@tanstack/react-router"
import { safeRedirectPathSchema } from "@workspace/shared"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  ChevronDownIcon,
  LoaderCircleIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { useAuthSignOutMutation } from "@/api/mutations/auth/useAuthSignOutMutation"
import { useAuthSessionQuery } from "@/api/queries/auth/useAuthSessionQuery"

type UserAccountMenuProps = {
  preserveDestinationOnSignOut?: boolean
}

export function UserAccountMenu({
  preserveDestinationOnSignOut = false,
}: UserAccountMenuProps) {
  const { t } = useTranslation()
  const { href } = useLocation()
  const navigate = useNavigate()
  const { data: session } = useAuthSessionQuery()

  const { mutate: signOut, isPending: isSignOutPending } =
    useAuthSignOutMutation({
      onSuccess: () => {
        void navigate({
          to: "/sign-in",
          search: {
            redirectTo: preserveDestinationOnSignOut
              ? safeRedirectPathSchema.safeParse(href).data
              : undefined,
          },
          replace: true,
        })
      },
    })

  if (!session?.authenticated) return null

  const { user } = session
  const initial =
    user.name.trim().charAt(0).toUpperCase() ||
    user.email.trim().charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-w-44 px-1.5"
            aria-label={t("account.menu")}
          />
        }
      >
        <Avatar className="size-4">
          <AvatarFallback className="bg-primary text-[9px] font-semibold text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="hidden truncate lg:block">{user.name}</span>
        <ChevronDownIcon className="hidden size-3.5 text-muted-foreground lg:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="mt-2 w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block truncate text-sm font-medium text-foreground">
              {user.name}
            </span>
            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void navigate({ to: "/account/activity" })}
        >
          <ShieldCheckIcon />
          {t("account.activity")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isSignOutPending}
          onClick={() => signOut()}
        >
          {isSignOutPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <LogOutIcon />
          )}
          {t(isSignOutPending ? "account.signing_out" : "account.sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
