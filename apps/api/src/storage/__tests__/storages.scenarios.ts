export const CUSTOM_STORAGE = {
  name: "Acme S3",
  endpoint: "https://s3.custom-storage.test",
  region: "eu-central-1",
  bucket: "acme-videos",
  forcePathStyle: false,
  pathTemplate: "videos/{year}/{month}/{videoId}",
  accessKeyId: "AKIAEXAMPLEKEY1234",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
} as const

export const REJECTED_PATH_TEMPLATES = [
  { description: "a template without {videoId}", pathTemplate: "{libraryId}" },
  {
    description: "an unknown variable",
    pathTemplate: "{tenant}/{videoId}",
  },
  {
    description: "a parent directory segment",
    pathTemplate: "../{videoId}",
  },
  {
    description: "an absolute path",
    pathTemplate: "/{videoId}",
  },
  {
    description: "an empty segment",
    pathTemplate: "videos//{videoId}",
  },
  {
    description: "a space",
    pathTemplate: "my videos/{videoId}",
  },
  {
    description: "an unclosed placeholder",
    pathTemplate: "{videoId",
  },
] as const

export const REJECTED_STORAGE_BODIES = [
  {
    description: "a bucket name with uppercase letters",
    body: { bucket: "Acme-Videos" },
  },
  { description: "an endpoint that is not a URL", body: { endpoint: "s3" } },
  {
    description: "an endpoint with another protocol",
    body: { endpoint: "ftp://s3.custom-storage.test" },
  },
  { description: "a blank secret", body: { secretAccessKey: " " } },
  { description: "a blank name", body: { name: " " } },
] as const
