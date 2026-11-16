import { z } from "zod"

/** Shape of decrypted storage credentials, checked before they are used. */
export const storageCredentialsSchema = z.object({
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
})
