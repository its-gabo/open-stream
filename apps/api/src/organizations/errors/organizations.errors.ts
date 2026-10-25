import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const ORGANIZATION_ERROR_CODES = {
  NOT_FOUND: "organization.not_found",
  PENDING_DELETION: "organization.pending_deletion",
  OWNER_REQUIRED: "organization.forbidden",
  MEMBERSHIP_LIMIT_REACHED: "organization.membership_limit_reached",
  SLUG_TAKEN: "organization.slug_taken",
  CONFIRMATION_MISMATCH: "organization.confirmation_mismatch",
  OWNER_CANNOT_LEAVE: "organization.leave.fail",
  INVALID_OWNERSHIP_RECIPIENT: "organization.ownership_transfer.fail",
  MEMBER_NOT_FOUND: "organization.member.remove.fail",
  ALREADY_MEMBER: "organization.invitation.already_member",
  INVITATION_ALREADY_PENDING: "organization.invitation.already_pending",
  INVITATION_NOT_FOUND: "organization.invitation.not_found",
  INVITATION_UNAVAILABLE: "organization.invitation.unavailable",
  INVITATION_EMAIL_MISMATCH: "organization.invitation.email_mismatch",
  INVITATION_EXPIRED: "organization.invitation.expired",
  DELETION_NOT_SCHEDULED: "organization.deletion.cancel.fail",
  INVALID_DELETION_ACTION: "organization.deletion_action.fail",
} as const

export const ORGANIZATION_ERRORS = {
  NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: ORGANIZATION_ERROR_CODES.NOT_FOUND,
    message: "Organization not found",
    reason: "organization.inaccessible",
  },
  PENDING_DELETION: {
    kind: DOMAIN_ERROR_KINDS.LOCKED,
    code: ORGANIZATION_ERROR_CODES.PENDING_DELETION,
    message: "This organization is pending deletion",
    reason: "organization.use_blocked",
  },
  OWNER_REQUIRED: {
    kind: DOMAIN_ERROR_KINDS.FORBIDDEN,
    code: ORGANIZATION_ERROR_CODES.OWNER_REQUIRED,
    message: "Only the organization owner can do this",
    reason: "organization.owner_required",
  },
  MEMBERSHIP_LIMIT_REACHED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: ORGANIZATION_ERROR_CODES.MEMBERSHIP_LIMIT_REACHED,
    message: "The organization membership limit has been reached",
    reason: "organization.membership_limit_reached",
  },
  SLUG_TAKEN: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: ORGANIZATION_ERROR_CODES.SLUG_TAKEN,
    message: "This organization address is already in use",
    reason: "organization.slug_taken",
  },
  CONFIRMATION_MISMATCH: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: ORGANIZATION_ERROR_CODES.CONFIRMATION_MISMATCH,
    message: "The confirmation does not match",
    reason: "organization.confirmation_mismatch",
  },
  OWNER_CANNOT_LEAVE: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: ORGANIZATION_ERROR_CODES.OWNER_CANNOT_LEAVE,
    message: "Transfer ownership before leaving the organization",
    reason: "organization.owner_cannot_leave",
  },
  INVALID_OWNERSHIP_RECIPIENT: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: ORGANIZATION_ERROR_CODES.INVALID_OWNERSHIP_RECIPIENT,
    message: "Ownership can only be transferred to a member",
    reason: "organization.invalid_ownership_recipient",
  },
  MEMBER_NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND,
    message: "Member not found",
    reason: "organization.member_not_found",
  },
  ALREADY_MEMBER: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: ORGANIZATION_ERROR_CODES.ALREADY_MEMBER,
    message: "This user is already a member of the organization",
    reason: "organization.already_member",
  },
  INVITATION_ALREADY_PENDING: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: ORGANIZATION_ERROR_CODES.INVITATION_ALREADY_PENDING,
    message: "This email already has a pending invitation",
    reason: "organization.pending_invitation",
  },
  INVITATION_NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: ORGANIZATION_ERROR_CODES.INVITATION_NOT_FOUND,
    message: "Invitation not found",
    reason: "organization.invitation_not_found",
  },
  INVITATION_UNAVAILABLE: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: ORGANIZATION_ERROR_CODES.INVITATION_UNAVAILABLE,
    message: "This invitation is no longer available",
    reason: "organization.invitation_not_pending",
  },
  INVITATION_EMAIL_MISMATCH: {
    kind: DOMAIN_ERROR_KINDS.FORBIDDEN,
    code: ORGANIZATION_ERROR_CODES.INVITATION_EMAIL_MISMATCH,
    message: "This invitation was sent to another email address",
    reason: "organization.invitation_email_mismatch",
  },
  INVITATION_EXPIRED: {
    kind: DOMAIN_ERROR_KINDS.GONE,
    code: ORGANIZATION_ERROR_CODES.INVITATION_EXPIRED,
    message: "This invitation has expired",
    reason: "organization.invitation_expired",
  },
  DELETION_NOT_SCHEDULED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: ORGANIZATION_ERROR_CODES.DELETION_NOT_SCHEDULED,
    message: "This organization is not scheduled for deletion",
    reason: "organization.deletion_not_scheduled",
  },
  INVALID_DELETION_ACTION: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: ORGANIZATION_ERROR_CODES.INVALID_DELETION_ACTION,
    message: "This deletion link is invalid or expired",
    reason: "organization.invalid_deletion_action",
  },
} as const satisfies DomainErrorCatalog<typeof ORGANIZATION_ERROR_CODES>
