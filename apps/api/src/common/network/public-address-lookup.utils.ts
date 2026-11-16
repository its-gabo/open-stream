import { lookup as resolveHost, type LookupAddress } from "node:dns"
import type { LookupFunction } from "node:net"
import { isPrivateAddress } from "./private-network.utils"

/** A host that resolved to an address of the server itself or its private network. */
export class PrivateAddressError extends Error {
  constructor(hostname: string) {
    super(`${hostname} resolves to a private address`)
    this.name = "PrivateAddressError"
  }
}

/**
 * A DNS lookup for outgoing connections that refuses hosts resolving to a
 * private address. The connection uses the addresses checked here, so a host
 * cannot answer a public address to the check and a private one to the
 * connection (DNS rebinding).
 */
export const lookupPublicAddress: LookupFunction = (
  hostname,
  options,
  callback
) => {
  resolveHost(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 0)

    const resolved = addresses as LookupAddress[]

    if (resolved.some(({ address }) => isPrivateAddress(address))) {
      return callback(new PrivateAddressError(hostname), "", 0)
    }

    if (options.all) return callback(null, resolved)

    const [first] = resolved

    if (!first) return callback(new PrivateAddressError(hostname), "", 0)

    callback(null, first.address, first.family)
  })
}
