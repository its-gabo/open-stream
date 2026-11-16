const ascii = (text: string) => Buffer.from(text, "ascii")

/** An ISO base media `ftyp` box with the given brands. */
const fileTypeBox = (majorBrand: string, compatibleBrands: string[]) => {
  const size = 16 + compatibleBrands.length * 4
  const box = Buffer.alloc(size)

  box.writeUInt32BE(size, 0)
  ascii("ftyp").copy(box, 4)
  ascii(majorBrand).copy(box, 8)
  box.writeUInt32BE(0x200, 12)
  compatibleBrands.forEach((brand, index) =>
    ascii(brand).copy(box, 16 + index * 4)
  )

  return box
}

export const VIDEO_FILE_HEADERS = {
  MP4: fileTypeBox("isom", ["isom", "iso2", "avc1", "mp41"]),
  MOV: fileTypeBox("qt  ", ["qt  "]),
  LEGACY_MOV: Buffer.concat([Buffer.from([0, 0, 0, 8]), ascii("wide")]),
  M4A: fileTypeBox("M4A ", ["M4A ", "mp42", "isom"]),
  HEIC: fileTypeBox("heic", ["mif1", "heic"]),
  PNG: Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13,
  ]),
  TEXT: ascii("just some text pretending to be a video"),
} as const

/** A file of `size` bytes starting with `header`, with a recognizable byte pattern after it. */
export const createFileBytes = (header: Uint8Array, size: number) => {
  const bytes = new Uint8Array(size)

  for (let index = 0; index < size; index += 1) bytes[index] = index % 251

  bytes.set(header.subarray(0, size))

  return bytes
}

export const encodeTusMetadata = (metadata: Record<string, string>) =>
  Object.entries(metadata)
    .map(([key, value]) => `${key} ${Buffer.from(value).toString("base64")}`)
    .join(",")
