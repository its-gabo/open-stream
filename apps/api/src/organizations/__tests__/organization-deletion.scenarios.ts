import { ORGANIZATION_DELETE_CONFIRMATION_PHRASE } from "@workspace/shared"

export const VALID_DELETION_CONFIRMATION = {
  organizationName: "Acme",
  confirmationPhrase: ORGANIZATION_DELETE_CONFIRMATION_PHRASE,
}

export const REJECTED_DELETION_CONFIRMATIONS = [
  {
    description: "a wrong confirmation phrase",
    body: { ...VALID_DELETION_CONFIRMATION, confirmationPhrase: "delete it" },
  },
  {
    description: "a wrong organization name",
    body: { ...VALID_DELETION_CONFIRMATION, organizationName: "ACME" },
  },
] as const
