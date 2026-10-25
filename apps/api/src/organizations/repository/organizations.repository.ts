import {
  ORGANIZATION_INVITATION_STATUSES,
  ORGANIZATION_ROLES,
} from "@workspace/shared"
import { and, asc, count, desc, eq, gt, inArray, lte, sql } from "drizzle-orm"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  organizationDeletionRequests,
  organizationInvitations,
  organizationMemberships,
  organizations,
  users,
  type NewOrganizationDeletionRequestRecord,
  type NewOrganizationInvitationRecord,
  type NewOrganizationMembershipRecord,
} from "../../db/schema"
import type {
  OrganizationAccess,
  OrganizationInvitationStatus,
  OrganizationRole,
  OrganizationStatus,
} from "../types/organizations.types"

const organizationSummaryColumns = {
  id: organizations.id,
  name: organizations.name,
  slug: organizations.slug,
  status: organizations.status,
  scheduledDeletionAt: organizationDeletionRequests.scheduledFor,
}

const membershipWithUserColumns = {
  membershipId: organizationMemberships.id,
  userId: organizationMemberships.userId,
  role: organizationMemberships.role,
  email: users.email,
  name: users.name,
}

export class OrganizationsRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  /** Serializes membership changes of one user, so the membership limit holds under concurrency. */
  async lockUser(userId: string, transaction: Transaction) {
    await transaction
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .for("update")
  }

  async findUserIdByEmail(email: string, executor: DatabaseExecutor) {
    const [user] = await executor
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))

    return user?.id ?? null
  }

  async countMemberships(userId: string, executor: DatabaseExecutor) {
    const [result] = await executor
      .select({ value: count() })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.userId, userId))

    return result?.value ?? 0
  }

  /** Returns `null` when the slug is already taken. */
  async insertOrganization(
    organization: { name: string; slug: string },
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(organizations)
      .values(organization)
      .onConflictDoNothing({ target: organizations.slug })
      .returning()

    return created ?? null
  }

  /** Returns `null` when the user is already a member. */
  async insertMembership(
    membership: NewOrganizationMembershipRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(organizationMemberships)
      .values(membership)
      .onConflictDoNothing()
      .returning({ id: organizationMemberships.id })

    return created ?? null
  }

  async slugExists(slug: string) {
    const [organization] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))

    return Boolean(organization)
  }

  listMembershipsOfUser(userId: string) {
    return this.db
      .select({
        membershipId: organizationMemberships.id,
        role: organizationMemberships.role,
        organization: organizationSummaryColumns,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationMemberships.organizationId)
      )
      .leftJoin(
        organizationDeletionRequests,
        eq(organizationDeletionRequests.organizationId, organizations.id)
      )
      .where(eq(organizationMemberships.userId, userId))
      .orderBy(
        sql`${organizationMemberships.lastSelectedAt} desc nulls last`,
        desc(organizationMemberships.createdAt)
      )
  }

  listPendingInvitationsForEmail(email: string) {
    return this.db
      .select({
        invitationId: organizationInvitations.id,
        expiresAt: organizationInvitations.expiresAt,
        organization: organizationSummaryColumns,
      })
      .from(organizationInvitations)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationInvitations.organizationId)
      )
      .leftJoin(
        organizationDeletionRequests,
        eq(organizationDeletionRequests.organizationId, organizations.id)
      )
      .where(
        and(
          eq(organizationInvitations.email, email),
          eq(
            organizationInvitations.status,
            ORGANIZATION_INVITATION_STATUSES.PENDING
          ),
          gt(organizationInvitations.expiresAt, new Date())
        )
      )
      .orderBy(desc(organizationInvitations.createdAt))
  }

  async findAccessBySlug(
    userId: string,
    slug: string
  ): Promise<OrganizationAccess | null> {
    const [access] = await this.db
      .select({
        membershipId: organizationMemberships.id,
        role: organizationMemberships.role,
        organization: organizationSummaryColumns,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationMemberships.organizationId)
      )
      .leftJoin(
        organizationDeletionRequests,
        eq(organizationDeletionRequests.organizationId, organizations.id)
      )
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizations.slug, slug)
        )
      )

    return access ?? null
  }

  async findOrganizationDetail(organizationId: string) {
    const [organization] = await this.db
      .select({
        ...organizationSummaryColumns,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .leftJoin(
        organizationDeletionRequests,
        eq(organizationDeletionRequests.organizationId, organizations.id)
      )
      .where(eq(organizations.id, organizationId))

    return organization ?? null
  }

  /** Locks the organization row; every membership, invitation and deletion change takes this lock first. */
  async lockOrganization(organizationId: string, transaction: Transaction) {
    const [organization] = await transaction
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .for("update")

    return organization ?? null
  }

  async updateOrganization(
    organizationId: string,
    changes: { name?: string; slug?: string; status?: OrganizationStatus },
    executor: DatabaseExecutor
  ) {
    const [organization] = await executor
      .update(organizations)
      .set(changes)
      .where(eq(organizations.id, organizationId))
      .returning()

    return organization ?? null
  }

  async deleteOrganization(organizationId: string, transaction: Transaction) {
    await transaction
      .delete(organizations)
      .where(eq(organizations.id, organizationId))
  }

  async markMembershipSelected(membershipId: string) {
    await this.db
      .update(organizationMemberships)
      .set({ lastSelectedAt: new Date() })
      .where(eq(organizationMemberships.id, membershipId))
  }

  async findMembershipOfUser(
    organizationId: string,
    userId: string,
    executor: DatabaseExecutor
  ) {
    const [membership] = await executor
      .select(membershipWithUserColumns)
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, userId)
        )
      )

    return membership ?? null
  }

  async findMembership(
    organizationId: string,
    membershipId: string,
    executor: DatabaseExecutor
  ) {
    const [membership] = await executor
      .select(membershipWithUserColumns)
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.id, membershipId)
        )
      )

    return membership ?? null
  }

  async findOwner(organizationId: string, executor: DatabaseExecutor) {
    const [owner] = await executor
      .select(membershipWithUserColumns)
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.role, ORGANIZATION_ROLES.OWNER)
        )
      )

    return owner ?? null
  }

  async setMembershipRole(
    membershipId: string,
    role: OrganizationRole,
    transaction: Transaction
  ) {
    await transaction
      .update(organizationMemberships)
      .set({ role })
      .where(eq(organizationMemberships.id, membershipId))
  }

  async deleteMembership(membershipId: string, transaction: Transaction) {
    await transaction
      .delete(organizationMemberships)
      .where(eq(organizationMemberships.id, membershipId))
  }

  /** Owner first, then members by name. */
  listTeamMembers(organizationId: string) {
    return this.db
      .select(membershipWithUserColumns)
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(eq(organizationMemberships.organizationId, organizationId))
      .orderBy(
        sql`${organizationMemberships.role} = ${ORGANIZATION_ROLES.OWNER} desc`,
        asc(users.name)
      )
  }

  listOpenInvitations(organizationId: string) {
    return this.db
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, organizationId),
          inArray(organizationInvitations.status, [
            ORGANIZATION_INVITATION_STATUSES.PENDING,
            ORGANIZATION_INVITATION_STATUSES.EXPIRED,
          ])
        )
      )
      .orderBy(desc(organizationInvitations.createdAt))
  }

  /** Returns `null` when the email already has a pending invitation to the organization. */
  async insertInvitation(
    invitation: NewOrganizationInvitationRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(organizationInvitations)
      .values(invitation)
      .onConflictDoNothing()
      .returning()

    return created ?? null
  }

  async lockInvitation(invitationId: string, transaction: Transaction) {
    const [invitation] = await transaction
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.id, invitationId))
      .for("update")

    return invitation ?? null
  }

  async updateInvitation(
    invitationId: string,
    changes: { status: OrganizationInvitationStatus; expiresAt?: Date },
    executor: DatabaseExecutor
  ) {
    const [invitation] = await executor
      .update(organizationInvitations)
      .set(changes)
      .where(eq(organizationInvitations.id, invitationId))
      .returning()

    return invitation ?? null
  }

  /** Marks pending invitations past their expiry as expired; narrowed to one organization and email when given. */
  async expireInvitations(
    scope?: { organizationId: string; email: string },
    executor: DatabaseExecutor = this.db
  ) {
    await executor
      .update(organizationInvitations)
      .set({ status: ORGANIZATION_INVITATION_STATUSES.EXPIRED })
      .where(
        and(
          eq(
            organizationInvitations.status,
            ORGANIZATION_INVITATION_STATUSES.PENDING
          ),
          lte(organizationInvitations.expiresAt, new Date()),
          scope &&
            eq(organizationInvitations.organizationId, scope.organizationId),
          scope && eq(organizationInvitations.email, scope.email)
        )
      )
  }

  async deleteExpiredInvitations(expiredBefore: Date) {
    await this.db
      .delete(organizationInvitations)
      .where(
        and(
          eq(
            organizationInvitations.status,
            ORGANIZATION_INVITATION_STATUSES.EXPIRED
          ),
          lte(organizationInvitations.expiresAt, expiredBefore)
        )
      )
  }

  /** Returns `null` when the organization already has a deletion request. */
  async insertDeletionRequest(
    request: NewOrganizationDeletionRequestRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(organizationDeletionRequests)
      .values(request)
      .onConflictDoNothing({
        target: organizationDeletionRequests.organizationId,
      })
      .returning()

    return created ?? null
  }

  async findDeletionRequestOfOrganization(
    organizationId: string,
    transaction: Transaction
  ) {
    const [request] = await transaction
      .select()
      .from(organizationDeletionRequests)
      .where(eq(organizationDeletionRequests.organizationId, organizationId))
      .for("update")

    return request ?? null
  }

  async lockDeletionRequestByCancelTokenHash(
    tokenHash: string,
    transaction: Transaction
  ) {
    const [request] = await transaction
      .select()
      .from(organizationDeletionRequests)
      .where(eq(organizationDeletionRequests.cancelTokenHash, tokenHash))
      .for("update")

    return request ?? null
  }

  async lockDeletionRequestByDeleteTokenHash(
    tokenHash: string,
    transaction: Transaction
  ) {
    const [request] = await transaction
      .select()
      .from(organizationDeletionRequests)
      .where(eq(organizationDeletionRequests.deleteTokenHash, tokenHash))
      .for("update")

    return request ?? null
  }

  /** Locks due requests, skipping ones another worker already holds. */
  claimDueDeletionRequests(limit: number, transaction: Transaction) {
    return transaction
      .select()
      .from(organizationDeletionRequests)
      .where(lte(organizationDeletionRequests.scheduledFor, new Date()))
      .orderBy(asc(organizationDeletionRequests.scheduledFor))
      .limit(limit)
      .for("update", { skipLocked: true })
  }

  async deleteDeletionRequest(requestId: string, transaction: Transaction) {
    await transaction
      .delete(organizationDeletionRequests)
      .where(eq(organizationDeletionRequests.id, requestId))
  }
}
