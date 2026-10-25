import { UserAccountMenu } from "@/modules/auth/components/user-account-menu"
import { OrganizationInboxMenu } from "@/modules/organizations/components/organization-inbox-menu"

type AppHeaderActionsProps = {
  preserveDestinationOnSignOut?: boolean
}

export function AppHeaderActions({
  preserveDestinationOnSignOut = false,
}: AppHeaderActionsProps) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-0.5">
      <OrganizationInboxMenu />
      <UserAccountMenu
        preserveDestinationOnSignOut={preserveDestinationOnSignOut}
      />
    </div>
  )
}
