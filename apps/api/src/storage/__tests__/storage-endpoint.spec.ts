import { describe, expect, it } from "bun:test"

import { isAllowedStorageEndpoint } from "../utils/storage-endpoint.utils"
import {
  PRIVATE_ENDPOINTS,
  PUBLIC_ENDPOINTS,
} from "./storage-endpoint.scenarios"

describe("Storage endpoint", () => {
  it.each(PUBLIC_ENDPOINTS)("allows %s", (endpoint) => {
    expect(
      isAllowedStorageEndpoint(endpoint, { allowPrivateNetwork: false })
    ).toBe(true)
  })

  it.each(PRIVATE_ENDPOINTS)("rejects $description", ({ endpoint }) => {
    expect(
      isAllowedStorageEndpoint(endpoint, { allowPrivateNetwork: false })
    ).toBe(false)
  })

  it("allows private HTTP endpoints when the private network is allowed", () => {
    expect(
      isAllowedStorageEndpoint("http://localhost:9000", {
        allowPrivateNetwork: true,
      })
    ).toBe(true)
  })
})
