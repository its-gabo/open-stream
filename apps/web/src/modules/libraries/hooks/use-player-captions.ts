import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import {
  PLAYER_CAPTIONS_OFF,
  PLAYER_CAPTIONS_STORAGE_KEY,
} from "../libraries.constants"
import { videoCaptionCuesQueryKey } from "../libraries.query-keys"
import { findCaptionCuesAt, parseCaptionVtt } from "../libraries.utils"

import type { PlayerCaptionTrack } from "../libraries.types"

const readRememberedLanguage = () => {
  try {
    return window.localStorage.getItem(PLAYER_CAPTIONS_STORAGE_KEY)
  } catch {
    return null
  }
}

const rememberLanguage = (language: string) => {
  try {
    window.localStorage.setItem(PLAYER_CAPTIONS_STORAGE_KEY, language)
  } catch {
    // Remembering is a convenience; private windows may refuse it.
  }
}

/**
 * The track the viewer last picked, matched by language, or else the
 * video's default; none when the viewer turned captions off.
 */
const pickInitialTrack = (tracks: PlayerCaptionTrack[]) => {
  const remembered = readRememberedLanguage()

  if (remembered === PLAYER_CAPTIONS_OFF) return null

  return (
    tracks.find(({ language }) => language === remembered) ??
    tracks.find(({ isDefault }) => isDefault) ??
    null
  )
}

/**
 * Which caption track plays, and its cues showing at `currentSeconds`. The
 * WebVTT is read only once its track is picked; a new list of tracks, e.g.
 * the next video of a playlist, picks again.
 */
export function usePlayerCaptions(
  tracks: PlayerCaptionTrack[],
  currentSeconds: number,
  { sendsCredentials }: { sendsCredentials: boolean }
) {
  // Compared by ids, so a list built anew on each render keeps its choice.
  const tracksKey = tracks.map(({ id }) => id).join(",")
  const [choice, setChoice] = useState(() => ({
    tracksKey,
    trackId: pickInitialTrack(tracks)?.id ?? null,
  }))
  // Picks again for new tracks while rendering, rather than one frame late in an effect.
  const trackId =
    choice.tracksKey === tracksKey
      ? choice.trackId
      : (pickInitialTrack(tracks)?.id ?? null)

  if (choice.tracksKey !== tracksKey) setChoice({ tracksKey, trackId })

  const selectedTrack = tracks.find(({ id }) => id === trackId) ?? null
  const { data: cues } = useQuery({
    queryKey: videoCaptionCuesQueryKey(selectedTrack?.url ?? ""),
    enabled: Boolean(selectedTrack),
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const response = await fetch(selectedTrack!.url, {
        credentials: sendsCredentials ? "include" : "omit",
      })

      return response.ok ? parseCaptionVtt(await response.text()) : []
    },
  })

  const selectTrack = (nextTrackId: string | null) => {
    setChoice({ tracksKey, trackId: nextTrackId })
    rememberLanguage(
      tracks.find(({ id }) => id === nextTrackId)?.language ??
        PLAYER_CAPTIONS_OFF
    )
  }

  return {
    selectedTrack,
    selectTrack,
    activeCues: selectedTrack
      ? findCaptionCuesAt(cues ?? [], currentSeconds)
      : [],
  }
}
