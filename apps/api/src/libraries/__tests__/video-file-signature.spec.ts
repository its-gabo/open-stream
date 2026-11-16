import { describe, expect, it } from "bun:test"

import { createFileBytes } from "../../../test/helpers/video-files"
import { detectVideoFileFormat } from "../utils/video-file-signature.utils"
import { VIDEO_FILE_SIGNATURES } from "./video-file-signature.scenarios"

describe("Video file signature", () => {
  it.each(VIDEO_FILE_SIGNATURES)(
    "detects $description as $format",
    ({ header, format }) => {
      expect(detectVideoFileFormat(createFileBytes(header, 1024))).toBe(format)
    }
  )

  it("rejects a file shorter than a box header", () => {
    expect(detectVideoFileFormat(new Uint8Array([0, 0, 0, 8]))).toBeNull()
  })
})
