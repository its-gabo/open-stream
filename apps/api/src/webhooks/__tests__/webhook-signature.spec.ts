import { describe, expect, it } from "bun:test"

import {
  generateWebhookSecret,
  signWebhook,
} from "../utils/webhook-signature.utils"

describe("signWebhook", () => {
  it("matches the Standard Webhooks reference signature", () => {
    expect(
      signWebhook("whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw", {
        id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
        timestamp: 1614265330,
        body: '{"test": 2432232314}',
      })
    ).toBe("v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=")
  })

  it("generates distinct secrets in the specification's format", () => {
    const secrets = [generateWebhookSecret(), generateWebhookSecret()]

    expect(secrets[0]).toMatch(/^whsec_[A-Za-z0-9+/]{43}=$/)
    expect(secrets[0]).not.toBe(secrets[1])
  })
})
