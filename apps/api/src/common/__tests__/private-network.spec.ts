import { describe, expect, it } from "bun:test"

import { isPrivateAddress } from "../network/private-network.utils"
import {
  PrivateAddressError,
  lookupPublicAddress,
} from "../network/public-address-lookup.utils"
import { ADDRESS_SCENARIOS } from "./private-network.scenarios"

describe("isPrivateAddress", () => {
  it.each(ADDRESS_SCENARIOS)(
    "$address is private: $isPrivate",
    ({ address, isPrivate }) => {
      expect(isPrivateAddress(address)).toBe(isPrivate)
    }
  )
})

describe("lookupPublicAddress", () => {
  it("refuses a host that resolves to a private address", async () => {
    const error = await new Promise<Error | null>((resolve) =>
      lookupPublicAddress("localhost", { all: true }, (lookupError) =>
        resolve(lookupError)
      )
    )

    expect(error).toBeInstanceOf(PrivateAddressError)
  })
})
