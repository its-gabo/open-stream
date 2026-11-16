import { describe, expect, it } from "bun:test"

import { createTestConfig } from "../../../test/helpers/test-app"
import { StorageSecretCipherService } from "../services/storage-secret-cipher.service"

const SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

describe("Storage secret cipher", () => {
  const cipher = new StorageSecretCipherService(createTestConfig())

  it("decrypts what it encrypted", () => {
    expect(cipher.decrypt(cipher.encrypt(SECRET))).toBe(SECRET)
  })

  it("never stores the secret in readable form", () => {
    expect(JSON.stringify(cipher.encrypt(SECRET))).not.toContain(SECRET)
  })

  it("encrypts the same secret differently every time", () => {
    expect(cipher.encrypt(SECRET).ciphertext).not.toBe(
      cipher.encrypt(SECRET).ciphertext
    )
  })

  it("rejects a tampered ciphertext", () => {
    const encrypted = cipher.encrypt(SECRET)
    const tampered = Buffer.from(encrypted.ciphertext, "base64")

    tampered[0] = tampered[0]! ^ 1

    expect(() =>
      cipher.decrypt({ ...encrypted, ciphertext: tampered.toString("base64") })
    ).toThrow()
  })

  it("cannot decrypt with another master key", () => {
    const otherCipher = new StorageSecretCipherService(
      createTestConfig({
        STORAGE_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
      })
    )

    expect(() => otherCipher.decrypt(cipher.encrypt(SECRET))).toThrow()
  })
})
