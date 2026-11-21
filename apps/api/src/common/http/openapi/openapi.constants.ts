import type { GenerateSpecOptions } from "hono-openapi"

export const OPENAPI_DOCUMENT_PATH = "/openapi.json"

export const OPENAPI_TAGS = {
  AUTH: "Auth",
  ORGANIZATIONS: "Organizations",
  LIBRARIES: "Libraries",
  STORAGES: "Storages",
  TRANSCRIPTION_PROVIDERS: "Transcription providers",
  LIBRARY_API: "Library API",
  ACTIVITY: "Activity",
  ANALYTICS: "Analytics",
} as const

export const OPENAPI_SECURITY_SCHEMES = {
  LIBRARY_API_KEY: "libraryApiKey",
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
    {
      name: OPENAPI_TAGS.LIBRARIES,
      description: "Video libraries, their storage and videos",
    },
    {
      name: OPENAPI_TAGS.STORAGES,
      description: "S3-compatible buckets libraries store videos in",
    },
    {
      name: OPENAPI_TAGS.TRANSCRIPTION_PROVIDERS,
      description:
        "Speech-to-text services libraries transcribe videos into captions with",
    },
    {
      name: OPENAPI_TAGS.LIBRARY_API,
      description:
        "Server-to-server access to one library with its API key: videos, tus uploads and playback",
    },
  ],
  components: {
    securitySchemes: {
      [OPENAPI_SECURITY_SCHEMES.LIBRARY_API_KEY]: {
        type: "http",
        scheme: "bearer",
        description: "The library's API key, from the library's API settings",
      },
    },
  },
}

export const API_ERROR_RESPONSE_DESCRIPTIONS = {
  ORIGIN_NOT_ALLOWED: "Request did not come from the web app origin",
  VALIDATION_FAILED: "Request body or query is invalid",
} as const
