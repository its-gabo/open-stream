import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import type { AppConfig } from "../../config/app.config"
import {
  STORAGE_CIPHER_ALGORITHM,
  STORAGE_CIPHER_IV_BYTES,
  STORAGE_DATA_KEY_BYTES,
} from "../constants/storage.constants"
import type { EncryptedSecret, SealedValue } from "../types/storage.types"

/**
 * Envelope encryption with AES-256-GCM: every secret gets its own random data
 * key, and only that data key is encrypted with `STORAGE_ENCRYPTION_KEY`.
 */
export class StorageSecretCipherService {
  private readonly masterKey: Buffer

  constructor(config: AppConfig) {
    this.masterKey = Buffer.from(config.STORAGE_ENCRYPTION_KEY, "base64")
  }

  encrypt(plaintext: string): EncryptedSecret {
    const dataKey = randomBytes(STORAGE_DATA_KEY_BYTES)
    const value = this.seal(dataKey, Buffer.from(plaintext, "utf8"))
    const key = this.seal(this.masterKey, dataKey)

    return {
      ciphertext: value.ciphertext.toString("base64"),
      iv: value.iv.toString("base64"),
      tag: value.tag.toString("base64"),
      encryptedKey: key.ciphertext.toString("base64"),
      keyIv: key.iv.toString("base64"),
      keyTag: key.tag.toString("base64"),
    }
  }

  decrypt(secret: EncryptedSecret): string {
    const dataKey = this.open(this.masterKey, {
      ciphertext: Buffer.from(secret.encryptedKey, "base64"),
      iv: Buffer.from(secret.keyIv, "base64"),
      tag: Buffer.from(secret.keyTag, "base64"),
    })

    return this.open(dataKey, {
      ciphertext: Buffer.from(secret.ciphertext, "base64"),
      iv: Buffer.from(secret.iv, "base64"),
      tag: Buffer.from(secret.tag, "base64"),
    }).toString("utf8")
  }

  private seal(key: Buffer, plaintext: Buffer): SealedValue {
    const iv = randomBytes(STORAGE_CIPHER_IV_BYTES)
    const cipher = createCipheriv(STORAGE_CIPHER_ALGORITHM, key, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])

    return { ciphertext, iv, tag: cipher.getAuthTag() }
  }

  private open(key: Buffer, { ciphertext, iv, tag }: SealedValue) {
    const decipher = createDecipheriv(STORAGE_CIPHER_ALGORITHM, key, iv)

    decipher.setAuthTag(tag)

    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  }
}
