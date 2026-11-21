import { ACTIVITY_ACTIONS } from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { DomainError } from "../../common/errors/domain-error"
import {
  toPageWindow,
  toPaginationDto,
} from "../../common/http/pagination/pagination.utils"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import {
  libraryActivityContext,
  libraryActivityResource,
} from "../../libraries/utils/library-activity.utils"
import { toVideoCtaLeadDto } from "../dto/ctas.dto.mappers"
import type {
  VideoCtaLeadExportQuery,
  VideoCtaLeadListQuery,
} from "../dto/ctas.schemas"
import { VIDEO_CTA_ERRORS } from "../errors/ctas.errors"
import type { VideoCtaLeadsRepository } from "../repository/video-cta-leads.repository"
import { leadActivityResource } from "../utils/cta-activity.utils"
import { toLeadsCsv, toLeadsExportFileName } from "../utils/lead-export.utils"

/** The email addresses viewers left in a library's calls to action. */
export class VideoCtaLeadsService {
  constructor(
    private readonly videoCtaLeadsRepository: VideoCtaLeadsRepository,
    private readonly activityLogService: ActivityLogService
  ) {}

  async listLeadPage(library: LibraryProfile, query: VideoCtaLeadListQuery) {
    const filter = {
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId: query.videoId,
      search: query.search,
    }
    const [leads, totalItems] = await Promise.all([
      this.videoCtaLeadsRepository.listLeadPage(filter, toPageWindow(query)),
      this.videoCtaLeadsRepository.countLeads(filter),
    ])

    return {
      leads: leads.map(toVideoCtaLeadDto),
      pagination: toPaginationDto(query, totalItems),
    }
  }

  /** Every lead of the library, or of one video, as a CSV file; the export itself is recorded. */
  async exportLeads(
    library: LibraryProfile,
    actor: ActivityActor,
    query: VideoCtaLeadExportQuery
  ) {
    const leads = await this.videoCtaLeadsRepository.listLeads({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId: query.videoId,
    })

    await this.activityLogService.recordActivity(actor, {
      organizationId: library.organizationId,
      action: ACTIVITY_ACTIONS.LIBRARY_LEADS_EXPORTED,
      resource: libraryActivityResource(library),
      after: { leadCount: leads.length, videoId: query.videoId ?? null },
    })

    return {
      fileName: toLeadsExportFileName(library.name, new Date()),
      csv: toLeadsCsv(leads),
    }
  }

  /** Removes the lead for good, e.g. when the viewer asks to be forgotten. */
  async deleteLead(
    library: LibraryProfile,
    actor: ActivityActor,
    leadId: string
  ) {
    await this.videoCtaLeadsRepository.transaction(async (transaction) => {
      const lead = await this.videoCtaLeadsRepository.deleteLead(
        {
          organizationId: library.organizationId,
          libraryId: library.id,
          leadId,
        },
        transaction
      )

      if (!lead) throw new DomainError(VIDEO_CTA_ERRORS.LEAD_NOT_FOUND)

      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: library.organizationId,
          action: ACTIVITY_ACTIONS.LEAD_DELETED,
          resource: leadActivityResource(lead),
          context: libraryActivityContext(library),
        },
        transaction
      )
    })
  }
}
