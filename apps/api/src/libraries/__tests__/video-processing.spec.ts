import { describe, expect, it } from "bun:test"

import { parseFfprobeOutput } from "../../media/utils/ffprobe.utils"
import { buildStoryboardVtt, planStoryboard } from "../utils/storyboard.utils"
import {
  appendQueryToReferences,
  isHlsFilePath,
} from "../utils/video-files.utils"
import {
  planRenditions,
  readVariantBandwidths,
} from "../utils/video-renditions.utils"
import { PROBE_OUTPUTS, RENDITION_PLANS } from "./video-processing.scenarios"

describe("video processing", () => {
  it.each(RENDITION_PLANS)("plans renditions: $description", (scenario) => {
    expect(
      planRenditions(scenario.qualities, scenario.source).map(
        ({ quality, width, height }) => ({ quality, width, height })
      )
    ).toEqual([...scenario.expected])
  })

  it.each(PROBE_OUTPUTS)("reads the probe of $description", (scenario) => {
    expect(parseFfprobeOutput(JSON.stringify(scenario.output))).toEqual(
      scenario.expected
    )
  })

  it("treats a file without a picture as unplayable", () => {
    expect(
      parseFfprobeOutput(
        JSON.stringify({
          streams: [{ codec_type: "audio", codec_name: "mp3" }],
          format: { duration: "60" },
        })
      )
    ).toBeNull()
  })

  it("reads the bandwidth of each variant", () => {
    const master = [
      "#EXTM3U",
      "#EXT-X-STREAM-INF:BANDWIDTH=1012000,RESOLUTION=640x360",
      "360p/playlist.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=3100000,RESOLUTION=1280x720",
      "720p/playlist.m3u8",
    ].join("\n")

    expect(Object.fromEntries(readVariantBandwidths(master))).toEqual({
      "360p": 1012000,
      "720p": 3100000,
    })
  })

  it("carries a playback signature to every referenced file", () => {
    const playlist = [
      "#EXTM3U",
      '#EXT-X-MAP:URI="init.mp4"',
      "#EXTINF:6.0,",
      "segment_00000.ts",
      "720p/playlist.m3u8",
      "",
    ].join("\n")
    const storyboard =
      "00:00:00.000 --> 00:00:02.000\nstoryboard.jpg#xywh=0,0,160,90"

    expect(appendQueryToReferences(playlist, "key=k&token=t")).toBe(
      [
        "#EXTM3U",
        '#EXT-X-MAP:URI="init.mp4?key=k&token=t"',
        "#EXTINF:6.0,",
        "segment_00000.ts?key=k&token=t",
        "720p/playlist.m3u8?key=k&token=t",
        "",
      ].join("\n")
    )
    expect(appendQueryToReferences(storyboard, "token=t")).toBe(
      "00:00:00.000 --> 00:00:02.000\nstoryboard.jpg?token=t#xywh=0,0,160,90"
    )
    expect(appendQueryToReferences(playlist, "")).toBe(playlist)
  })

  it.each([
    { path: "master.m3u8", isAllowed: true },
    { path: "720p/playlist.m3u8", isAllowed: true },
    { path: "720p/segment_00012.ts", isAllowed: true },
    { path: "1080p/playlist.m3u8", isAllowed: false },
    { path: "../source", isAllowed: false },
    { path: "720p/../../source", isAllowed: false },
    { path: "720p/segment_1.ts", isAllowed: false },
  ])("allows the HLS path $path: $isAllowed", ({ path, isAllowed }) => {
    expect(isHlsFilePath(path, ["360p", "720p"])).toBe(isAllowed)
  })

  it("lays out a storyboard and its WebVTT cues", () => {
    const layout = planStoryboard({
      durationSeconds: 5,
      width: 1920,
      height: 1080,
    })

    expect(layout).toEqual({
      intervalSeconds: 2,
      tileCount: 3,
      tileWidth: 160,
      tileHeight: 90,
      columns: 3,
      rows: 1,
    })
    expect(buildStoryboardVtt(layout, 5, "storyboard.jpg")).toBe(
      [
        "WEBVTT",
        "",
        "00:00:00.000 --> 00:00:02.000",
        "storyboard.jpg#xywh=0,0,160,90",
        "",
        "00:00:02.000 --> 00:00:04.000",
        "storyboard.jpg#xywh=160,0,160,90",
        "",
        "00:00:04.000 --> 00:00:05.000",
        "storyboard.jpg#xywh=320,0,160,90",
        "",
      ].join("\n")
    )
  })

  it("never shows more than a hundred storyboard tiles", () => {
    const layout = planStoryboard({
      durationSeconds: 3 * 60 * 60,
      width: 1280,
      height: 720,
    })

    expect(layout.tileCount).toBeLessThanOrEqual(100)
    expect(layout.columns * layout.rows).toBeGreaterThanOrEqual(
      layout.tileCount
    )
  })
})
