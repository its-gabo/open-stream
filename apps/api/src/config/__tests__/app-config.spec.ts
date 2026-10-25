import { describe, expect, it } from "bun:test"

import { readConfig } from "../app.config"
import {
  REJECTED_ENVIRONMENTS,
  VALID_ENVIRONMENT,
} from "./app-config.scenarios"

describe("App config", () => {
  it("makes cookies secure by default in production", () => {
    const config = readConfig({
      ...VALID_ENVIRONMENT,
      NODE_ENV: "production",
      WEB_ORIGIN: "https://app.test/some/path",
    })

    expect(config.AUTH_COOKIE_SECURE).toBe(true)
    expect(config.WEB_ORIGIN).toBe("https://app.test")
  })

  it.each(REJECTED_ENVIRONMENTS)(
    "rejects $description",
    ({ environment, error }) => {
      expect(() =>
        readConfig({ ...VALID_ENVIRONMENT, ...environment })
      ).toThrow(error)
    }
  )

  it("never echoes secret values in validation errors", () => {
    const secret = "short-secret-value"

    expect(() =>
      readConfig({ ...VALID_ENVIRONMENT, AUTH_SECRET: secret })
    ).not.toThrow(secret)
  })
})
