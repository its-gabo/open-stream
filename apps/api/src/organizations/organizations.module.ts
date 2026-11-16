import { OrganizationsRepository } from "./repository/organizations.repository"
import { OrganizationActionLinkService } from "./services/organization-action-link.service"
import { OrganizationDeletionService } from "./services/organization-deletion.service"
import { OrganizationEmailService } from "./services/organization-email.service"
import { OrganizationInvitationsService } from "./services/organization-invitations.service"
import { OrganizationSweeperService } from "./services/organization-sweeper.service"
import { OrganizationTeamService } from "./services/organization-team.service"
import { OrganizationsService } from "./services/organizations.service"
import type { OrganizationModuleDependencies } from "./types/organizations.types"

export function createOrganizationsModule(
  dependencies: OrganizationModuleDependencies
) {
  const {
    db,
    config,
    outboxService,
    authTokenService,
    activityLogService,
    videoFilesCleanupService,
    logger,
  } = dependencies

  const organizationsRepository = new OrganizationsRepository(db)
  const organizationEmailService = new OrganizationEmailService()
  const organizationActionLinkService = new OrganizationActionLinkService(
    config
  )
  const organizationDeletionService = new OrganizationDeletionService(
    organizationsRepository,
    outboxService,
    authTokenService,
    organizationActionLinkService,
    organizationEmailService,
    activityLogService,
    videoFilesCleanupService
  )

  return {
    organizationsService: new OrganizationsService(
      organizationsRepository,
      activityLogService
    ),
    organizationTeamService: new OrganizationTeamService(
      organizationsRepository,
      outboxService,
      organizationEmailService,
      organizationActionLinkService,
      activityLogService
    ),
    organizationInvitationsService: new OrganizationInvitationsService(
      organizationsRepository,
      outboxService,
      organizationEmailService,
      activityLogService
    ),
    organizationDeletionService,
    organizationSweeperService: new OrganizationSweeperService(
      organizationsRepository,
      organizationDeletionService,
      logger.child("organizations"),
      config
    ),
  }
}

export type OrganizationsModule = ReturnType<typeof createOrganizationsModule>
