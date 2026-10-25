import { getErrorStack } from "../../common/utils/error.utils"
import { DAY_MS } from "../../common/time/time.constants"
import type { AppConfig } from "../../config/app.config"
import { ORGANIZATION_INVITATION_RETENTION_DAYS } from "../constants/organizations.constants"
import type { OrganizationsRepository } from "../repository/organizations.repository"
import type { OrganizationDeletionService } from "./organization-deletion.service"

/**
 * Worker-side housekeeping: permanently deletes organizations whose grace
 * period ended, and expires then purges old invitations.
 */
export class OrganizationSweeperService {
  private sweepTimer: Timer | null = null
  private currentSweep: Promise<void> = Promise.resolve()

  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly organizationDeletionService: OrganizationDeletionService,
    private readonly config: AppConfig
  ) {}

  startSweeping() {
    this.sweepTimer = setInterval(() => {
      this.currentSweep = this.currentSweep
        .then(() => this.sweep())
        .catch((error) =>
          console.error("Organization sweep failed", getErrorStack(error))
        )
    }, this.config.ORGANIZATION_SWEEP_INTERVAL_MS)
  }

  async stopSweeping() {
    if (this.sweepTimer) clearInterval(this.sweepTimer)
    await this.currentSweep
  }

  async sweep() {
    await this.organizationDeletionService.deleteDueOrganizations()
    await this.organizationsRepository.expireInvitations()
    await this.organizationsRepository.deleteExpiredInvitations(
      new Date(Date.now() - ORGANIZATION_INVITATION_RETENTION_DAYS * DAY_MS)
    )
  }
}
