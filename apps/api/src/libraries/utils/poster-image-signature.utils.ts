const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte)

const readAscii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length))

/** Whether the bytes start like a JPEG, PNG or WebP image, whatever the file claims to be. */
export const isPosterImage = (bytes: Uint8Array) =>
  startsWith(bytes, JPEG_SIGNATURE) ||
  startsWith(bytes, PNG_SIGNATURE) ||
  (bytes.length >= 12 &&
    readAscii(bytes, 0, 4) === "RIFF" &&
    readAscii(bytes, 8, 4) === "WEBP")
