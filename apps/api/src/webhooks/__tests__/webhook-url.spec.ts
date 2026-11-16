import { describe, expect, it } from "bun:test"

import { isAllowedWebhookUrl } from "../utils/webhook-url.utils"

describe("isAllowedWebhookUrl", () => {
  it.each([
    { url: "https://hooks.example.com/openstream", expected: true },
    { url: "http://hooks.example.com/openstream", expected: false },
    { url: "https://localhost:3000/hooks", expected: false },
    { url: "https://192.168.1.10/hooks", expected: false },
    { url: "https://169.254.169.254/latest", expected: false },
    { url: "https://[::ffff:a00:1]/hooks", expected: false },
    { url: "https://user:pass@hooks.example.com/", expected: false },
    { url: "not a url", expected: false },
  ])("public only: $url is $expected", ({ url, expected }) => {
    expect(isAllowedWebhookUrl(url, { allowPrivateNetwork: false })).toBe(
      expected
    )
  })

  it.each([
    { url: "http://localhost:3000/hooks", expected: true },
    { url: "ftp://localhost/hooks", expected: false },
  ])("private allowed: $url is $expected", ({ url, expected }) => {
    expect(isAllowedWebhookUrl(url, { allowPrivateNetwork: true })).toBe(
      expected
    )
  })
})
