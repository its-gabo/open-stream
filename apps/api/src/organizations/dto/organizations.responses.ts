import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const ORGANIZATION_SUCCESS_CODES = {
  CONTEXT: "organization.context.success",
  SLUG_SUGGESTION: "organization.slug_suggestion.success",
  CREATE: "organization.create.success",
  GET: "organization.get.success",
  UPDATE: "organization.update.success",
  SELECT: "organization.select.success",
  LEAVE: "organization.leave.success",
  OWNERSHIP_TRANSFER: "organization.ownership_transfer.success",
  TEAM: "organization.team.success",
  INVITATION_CREATE: "organization.invitation.create.success",
  INVITATION_RESEND: "organization.invitation.resend.success",
  INVITATION_CANCEL: "organization.invitation.cancel.success",
  INVITATION_ACCEPT: "organization.invitation.accept.success",
  INVITATION_DECLINE: "organization.invitation.decline.success",
  MEMBER_REMOVE: "organization.member.remove.success",
  DELETION_SCHEDULE: "organization.deletion.schedule.success",
  DELETION_CANCEL: "organization.deletion.cancel.success",
  DELETION_ACTION_CANCEL: "organization.deletion_action.cancel.success",
  DELETION_ACTION_DELETE: "organization.deletion_action.delete.success",
} as const

export const ORGANIZATION_SUCCESS_RESULTS = {
  CONTEXT: {
    code: ORGANIZATION_SUCCESS_CODES.CONTEXT,
    message: "Organization context fetched.",
  },
  SLUG_SUGGESTION: {
    code: ORGANIZATION_SUCCESS_CODES.SLUG_SUGGESTION,
    message: "Organization address suggested.",
  },
  CREATE: {
    code: ORGANIZATION_SUCCESS_CODES.CREATE,
    message: "Organization created.",
  },
  GET: {
    code: ORGANIZATION_SUCCESS_CODES.GET,
    message: "Organization fetched.",
  },
  UPDATE: {
    code: ORGANIZATION_SUCCESS_CODES.UPDATE,
    message: "Organization updated.",
  },
  SELECT: {
    code: ORGANIZATION_SUCCESS_CODES.SELECT,
    message: "Organization selected.",
  },
  LEAVE: {
    code: ORGANIZATION_SUCCESS_CODES.LEAVE,
    message: "You left the organization.",
  },
  OWNERSHIP_TRANSFER: {
    code: ORGANIZATION_SUCCESS_CODES.OWNERSHIP_TRANSFER,
    message: "Organization ownership transferred.",
  },
  TEAM: {
    code: ORGANIZATION_SUCCESS_CODES.TEAM,
    message: "Organization team fetched.",
  },
  INVITATION_CREATE: {
    code: ORGANIZATION_SUCCESS_CODES.INVITATION_CREATE,
    message: "Invitation sent.",
  },
  INVITATION_RESEND: {
    code: ORGANIZATION_SUCCESS_CODES.INVITATION_RESEND,
    message: "Invitation resent.",
  },
  INVITATION_CANCEL: {
    code: ORGANIZATION_SUCCESS_CODES.INVITATION_CANCEL,
    message: "Invitation canceled.",
  },
  INVITATION_ACCEPT: {
    code: ORGANIZATION_SUCCESS_CODES.INVITATION_ACCEPT,
    message: "Invitation accepted.",
  },
  INVITATION_DECLINE: {
    code: ORGANIZATION_SUCCESS_CODES.INVITATION_DECLINE,
    message: "Invitation declined.",
  },
  MEMBER_REMOVE: {
    code: ORGANIZATION_SUCCESS_CODES.MEMBER_REMOVE,
    message: "Member removed.",
  },
  DELETION_SCHEDULE: {
    code: ORGANIZATION_SUCCESS_CODES.DELETION_SCHEDULE,
    message: "Organization deletion scheduled.",
  },
  DELETION_CANCEL: {
    code: ORGANIZATION_SUCCESS_CODES.DELETION_CANCEL,
    message: "Organization deletion canceled.",
  },
  DELETION_ACTION_CANCEL: {
    code: ORGANIZATION_SUCCESS_CODES.DELETION_ACTION_CANCEL,
    message: "Organization deletion canceled.",
  },
  DELETION_ACTION_DELETE: {
    code: ORGANIZATION_SUCCESS_CODES.DELETION_ACTION_DELETE,
    message: "Organization permanently deleted.",
  },
} as const satisfies ApiResultCatalog<typeof ORGANIZATION_SUCCESS_CODES>
