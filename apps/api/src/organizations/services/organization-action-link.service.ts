import type { AppConfig } from "../../config/app.config"
import { ORGANIZATION_ACTION_PATHS } from "../constants/organizations.constants"
import type { OrganizationDeletionAction } from "../types/organizations.types"

export class OrganizationActionLinkService {
  constructor(private readonly config: AppConfig) {}

  /** The invitee's inbox, where every pending invitation can be accepted or declined. */
  buildInvitationUrl(invitationId: string) {
    return this.buildWebAppUrl(
      ORGANIZATION_ACTION_PATHS.INBOX,
      new URLSearchParams({ invitationId })
    )
  }

  buildDeletionActionUrl(action: OrganizationDeletionAction, rawToken: string) {
    return this.buildWebAppUrl(
      ORGANIZATION_ACTION_PATHS.DELETION,
      new URLSearchParams({ action, token: rawToken })
    )
  }

  private buildWebAppUrl(path: string, searchParams: URLSearchParams) {
    const url = new URL(path, this.config.WEB_ORIGIN)
    url.search = searchParams.toString()

    return url.toString()
  }
}
