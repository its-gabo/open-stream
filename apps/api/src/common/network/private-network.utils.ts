import { isIP, isIPv4 } from "node:net"
import { PRIVATE_HOST_SUFFIXES } from "./network.constants"

/** Addresses that are not on the public internet: private, local, shared, reserved, documentation or multicast. */
const PRIVATE_IPV4_RANGES: ReadonlyArray<[number, number]> = [
  [0x00000000, 8], // 0.0.0.0/8
  [0x0a000000, 8], // 10.0.0.0/8
  [0x64400000, 10], // 100.64.0.0/10
  [0x7f000000, 8], // 127.0.0.0/8
  [0xa9fe0000, 16], // 169.254.0.0/16, includes cloud metadata endpoints
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0000000, 24], // 192.0.0.0/24
  [0xc0000200, 24], // 192.0.2.0/24
  [0xc0a80000, 16], // 192.168.0.0/16
  [0xc6120000, 15], // 198.18.0.0/15
  [0xc6336400, 24], // 198.51.100.0/24
  [0xcb007100, 24], // 203.0.113.0/24
  [0xe0000000, 4], // 224.0.0.0/4, multicast
  [0xf0000000, 4], // 240.0.0.0/4, includes 255.255.255.255
]

/** IPv6 ranges, as [first hextets, prefix length], that never reach a public host. */
const PRIVATE_IPV6_RANGES: ReadonlyArray<[number[], number]> = [
  [[0x0064, 0xff9b, 0x0001], 48], // 64:ff9b:1::/48, local NAT64
  [[0x0100], 64], // 100::/64, discard
  [[0x2001, 0x0000], 32], // 2001::/32, Teredo, whose IPv4 cannot be checked
  [[0x2001, 0x0db8], 32], // 2001:db8::/32, documentation
  [[0xfc00], 7], // fc00::/7, unique local
  [[0xfe80], 10], // fe80::/10, link-local
  [[0xfec0], 10], // fec0::/10, site-local
  [[0xff00], 8], // ff00::/8, multicast
]

const ipv4ToNumber = (address: string) =>
  address.split(".").reduce((value, octet) => value * 256 + Number(octet), 0)

const isPrivateIpv4Number = (value: number) =>
  PRIVATE_IPV4_RANGES.some(([network, prefixLength]) => {
    const blockSize = 2 ** (32 - prefixLength)

    return Math.floor(value / blockSize) === Math.floor(network / blockSize)
  })

/** The eight 16-bit groups of a valid IPv6 address, with a trailing dotted IPv4 part expanded. */
const parseIpv6 = (address: string) => {
  const dotted = address.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/)
  const withoutDotted = dotted
    ? `${dotted[1]}${(ipv4ToNumber(dotted[2]!) >>> 16).toString(16)}:${(ipv4ToNumber(dotted[2]!) & 0xffff).toString(16)}`
    : address
  const [head = "", tail] = withoutDotted.split("::")
  const toGroups = (part: string) =>
    part ? part.split(":").map((group) => parseInt(group, 16)) : []
  const headGroups = toGroups(head)
  const tailGroups = toGroups(tail ?? "")

  return tail === undefined
    ? headGroups
    : [
        ...headGroups,
        ...Array<number>(8 - headGroups.length - tailGroups.length).fill(0),
        ...tailGroups,
      ]
}

const startsWithPrefix = (groups: number[], prefix: number[], length: number) =>
  prefix.every((group, index) => {
    const bits = Math.min(16, Math.max(0, length - index * 16))
    const mask = bits === 0 ? 0 : (0xffff << (16 - bits)) & 0xffff

    return (groups[index]! & mask) === (group & mask)
  })

const ipv4Of = (high: number, low: number) => high * 0x10000 + low

/**
 * The IPv4 address an IPv6 one carries and is delivered to: IPv4-mapped
 * (`::ffff:a.b.c.d`), IPv4-compatible (`::a.b.c.d`), NAT64 (`64:ff9b::/96`)
 * and 6to4 (`2002::/16`); `URL` writes the IPv4 part in hex.
 */
const embeddedIpv4Of = (groups: number[]) => {
  const leadingZeros = groups.slice(0, 5).every((group) => group === 0)

  if (leadingZeros && (groups[5] === 0xffff || groups[5] === 0)) {
    return ipv4Of(groups[6]!, groups[7]!)
  }

  if (startsWithPrefix(groups, [0x0064, 0xff9b, 0, 0, 0, 0], 96)) {
    return ipv4Of(groups[6]!, groups[7]!)
  }

  if (groups[0] === 0x2002) return ipv4Of(groups[1]!, groups[2]!)

  return null
}

const isPrivateIpv6 = (address: string) => {
  const groups = parseIpv6(address.toLowerCase().replace(/%.*$/, ""))
  const embeddedIpv4 = embeddedIpv4Of(groups)

  // `::` and `::1` fall in the IPv4-compatible range, as 0.0.0.0 and 0.0.0.1.
  if (embeddedIpv4 !== null) return isPrivateIpv4Number(embeddedIpv4)

  return PRIVATE_IPV6_RANGES.some(([prefix, length]) =>
    startsWithPrefix(groups, prefix, length)
  )
}

/** Whether a resolved IPv4 or IPv6 address is not a public internet address. */
export const isPrivateAddress = (address: string) =>
  isIPv4(address)
    ? isPrivateIpv4Number(ipv4ToNumber(address))
    : isPrivateIpv6(address)

/** Whether a hostname or IP literal names the server itself or a private network; hostnames are not resolved. */
export const isPrivateHost = (hostname: string) => {
  // A trailing dot names the same host: `localhost.` is `localhost`.
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")

  if (isIP(host)) return isPrivateAddress(host)

  return PRIVATE_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(suffix)
  )
}
