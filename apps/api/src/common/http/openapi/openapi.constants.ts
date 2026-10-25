import type { GenerateSpecOptions } from "hono-openapi"

export const OPENAPI_DOCUMENT_PATH = "/openapi.json"

export const OPENAPI_TAGS = {
  AUTH: "Auth",
  ORGANIZATIONS: "Organizations",
} as const

export const OPENAPI_DOCUMENTATION: GenerateSpecOptions["documentation"] = {
  openapi: "3.1.0",
  info: {
    title: "OpenStream API",
    version: "1.0.0",
    description: "HTTP API of the OpenStream video platform.",
  },
  tags: [
    {
      name: OPENAPI_TAGS.AUTH,
      description: "Accounts, sessions and passwords",
    },
    {
      name: OPENAPI_TAGS.ORGANIZATIONS,
      description: "Organizations, their teams, invitations and deletion",
    },
  ],
}

export const API_ERROR_RESPONSE_DESCRIPTIONS = {
  ORIGIN_NOT_ALLOWED: "Request did not come from the web app origin",
  VALIDATION_FAILED: "Request body or query is invalid",
} as const
