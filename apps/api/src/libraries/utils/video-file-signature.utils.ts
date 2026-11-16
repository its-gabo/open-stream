import { VIDEO_FILE_FORMATS, type VideoFileFormat } from "@workspace/shared"

const QUICKTIME_BRAND = "qt  "

/** ISO base media brands of MP4 video files. */
const MP4_VIDEO_BRANDS: ReadonlySet<string> = new Set([
  "isom",
  "iso2",
  "iso3",
  "iso4",
  "iso5",
  "iso6",
  "iso8",
  "iso9",
  "mp41",
  "mp42",
  "mp71",
  "avc1",
  "M4V ",
  "M4VH",
  "M4VP",
  "MSNV",
  "dash",
  "mmp4",
  "XAVC",
  "f4v ",
])

/** Major brands of files that share the container but are not video: audio, images and others. */
const NON_VIDEO_BRANDS: ReadonlySet<string> = new Set([
  "M4A ",
  "M4B ",
  "M4P ",
  "F4A ",
  "F4B ",
  "heic",
  "heix",
  "hevc",
  "heim",
  "heis",
  "mif1",
  "msf1",
  "avif",
  "avis",
  "crx ",
  "jp2 ",
])

/** Atoms a QuickTime file without an `ftyp` box may start with. */
const LEGACY_QUICKTIME_ATOMS: ReadonlySet<string> = new Set([
  "moov",
  "mdat",
  "free",
  "skip",
  "wide",
  "pnot",
])

const readAscii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length))

const readUint32 = (bytes: Uint8Array, start: number) =>
  new DataView(bytes.buffer, bytes.byteOffset + start, 4).getUint32(0)

const readFileTypeBrands = (bytes: Uint8Array) => {
  const boxSize = Math.min(readUint32(bytes, 0), bytes.length)
  const compatibleBrands: string[] = []

  for (let offset = 16; offset + 4 <= boxSize; offset += 4) {
    compatibleBrands.push(readAscii(bytes, offset, 4))
  }

  return { majorBrand: readAscii(bytes, 8, 4), compatibleBrands }
}

/**
 * The real format of a video from its first bytes, regardless of its name:
 * MP4 and MOV share the ISO base media container and differ in the brands of
 * its leading `ftyp` box. Returns `null` for anything else.
 */
export const detectVideoFileFormat = (
  bytes: Uint8Array
): VideoFileFormat | null => {
  if (bytes.length < 12) return null

  const firstBoxType = readAscii(bytes, 4, 4)

  if (firstBoxType !== "ftyp") {
    return LEGACY_QUICKTIME_ATOMS.has(firstBoxType)
      ? VIDEO_FILE_FORMATS.MOV
      : null
  }

  const { majorBrand, compatibleBrands } = readFileTypeBrands(bytes)

  if (majorBrand === QUICKTIME_BRAND) return VIDEO_FILE_FORMATS.MOV
  if (NON_VIDEO_BRANDS.has(majorBrand)) return null

  const isMp4 = [majorBrand, ...compatibleBrands].some((brand) =>
    MP4_VIDEO_BRANDS.has(brand)
  )

  return isMp4 ? VIDEO_FILE_FORMATS.MP4 : null
}
