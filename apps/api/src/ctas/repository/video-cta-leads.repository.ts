import { and, desc, eq } from "drizzle-orm"
import type { PageWindow } from "../../common/http/pagination/pagination.types"
import type { Database, Transaction } from "../../db/database.types"
import { videoCtaLeads } from "../../db/schema"
import type { VideoCtaLeadFilter } from "../types/ctas.types"
import { videoCtaLeadCondition } from "../utils/cta-query.utils"

export class VideoCtaLeadsRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  /** Newest first. */
  listLeadPage(filter: VideoCtaLeadFilter, window: PageWindow) {
    return this.db
      .select()
      .from(videoCtaLeads)
      .where(videoCtaLeadCondition(filter))
      .orderBy(desc(videoCtaLeads.createdAt), desc(videoCtaLeads.id))
      .limit(window.limit)
      .offset(window.offset)
  }

  countLeads(filter: VideoCtaLeadFilter) {
    return this.db.$count(videoCtaLeads, videoCtaLeadCondition(filter))
  }

  /** Every matching lead, newest first. */
  listLeads(filter: VideoCtaLeadFilter) {
    return this.db
      .select()
      .from(videoCtaLeads)
      .where(videoCtaLeadCondition(filter))
      .orderBy(desc(videoCtaLeads.createdAt), desc(videoCtaLeads.id))
  }

  /** Null when the library has no such lead. */
  async deleteLead(
    {
      organizationId,
      libraryId,
      leadId,
    }: { organizationId: string; libraryId: string; leadId: string },
    transaction: Transaction
  ) {
    const [deleted] = await transaction
      .delete(videoCtaLeads)
      .where(
        and(
          eq(videoCtaLeads.organizationId, organizationId),
          eq(videoCtaLeads.libraryId, libraryId),
          eq(videoCtaLeads.id, leadId)
        )
      )
      .returning()

    return deleted ?? null
  }
}
