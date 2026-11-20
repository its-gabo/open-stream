import {
  playlistDescriptionSchema,
  playlistTitleSchema,
  playlistVideoIdsSchema,
} from "@workspace/shared"
import { z } from "zod"
import { createApiSuccessResponseSchema } from "../../common/http/response/response.schemas"
import {
  libraryParamSchema,
  libraryPlayerSettingsDtoSchema,
  publicLibraryParamSchema,
  videoDtoSchema,
  videoEmbedDtoSchema,
} from "../../libraries/dto/libraries.schemas"

export const playlistParamSchema = libraryParamSchema.extend({
  playlistId: z.uuid(),
})

export const publicPlaylistParamSchema = publicLibraryParamSchema.extend({
  playlistId: z.uuid(),
})

/** The videos are optional: a playlist can start empty and be filled later. */
export const playlistCreateBodySchema = z
  .object({
    title: playlistTitleSchema,
    description: playlistDescriptionSchema.nullable().optional(),
    videoIds: playlistVideoIdsSchema.optional(),
  })
  .meta({ id: "PlaylistCreateBody" })

/** Only the fields sent change; an empty or null description removes it. */
export const playlistUpdateBodySchema = z
  .object({
    title: playlistTitleSchema.optional(),
    description: playlistDescriptionSchema.nullable().optional(),
  })
  .refine((body) => body.title !== undefined || body.description !== undefined)
  .meta({ id: "PlaylistUpdateBody" })

/** Replaces all of the playlist's videos, in playback order; an empty list removes them. */
export const playlistVideosUpdateBodySchema = z
  .object({ videoIds: playlistVideoIdsSchema })
  .meta({ id: "PlaylistVideosUpdateBody" })

export const playlistSummaryDtoSchema = z
  .object({
    id: z.uuid(),
    libraryId: z.uuid(),
    title: z.string(),
    /** Null when the playlist has none. */
    description: z.string().nullable(),
    videoCount: z.int().nonnegative(),
    /** Of the videos processed so far. */
    durationSeconds: z.number().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "PlaylistSummary" })

export const playlistDtoSchema = playlistSummaryDtoSchema
  .extend({
    /** In playback order, whether processed yet or not. */
    videos: z.array(videoDtoSchema),
  })
  .meta({ id: "Playlist" })

export const playlistPlaybackUrlDtoSchema = z
  .object({
    /** The embeddable player page, for an iframe; it signs each video the playlist plays. */
    embedUrl: z.url(),
    expiresAt: z.iso.datetime(),
  })
  .meta({ id: "PlaylistPlaybackUrl" })

export const playlistEmbedVideoDtoSchema = videoEmbedDtoSchema
  .omit({ allowedPlaybackHosts: true, player: true })
  .meta({ id: "PlaylistEmbedVideo" })

export const playlistEmbedDtoSchema = z
  .object({
    playlistId: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    /** The processed videos, in playback order; each URL carries its own signature in signed libraries. */
    videos: z.array(playlistEmbedVideoDtoSchema),
    /** Hosts allowed to frame the player; empty when any site may. */
    allowedPlaybackHosts: z.array(z.string()),
    player: libraryPlayerSettingsDtoSchema,
  })
  .meta({ id: "PlaylistEmbed" })

export const playlistListSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ playlists: z.array(playlistSummaryDtoSchema) })
).meta({ id: "PlaylistListSuccessResponse" })

export const playlistSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ playlist: playlistDtoSchema })
).meta({ id: "PlaylistSuccessResponse" })

export const playlistPlaybackUrlSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ playback: playlistPlaybackUrlDtoSchema })
  ).meta({ id: "PlaylistPlaybackUrlSuccessResponse" })

export const playlistEmbedSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ embed: playlistEmbedDtoSchema })
  ).meta({ id: "PlaylistEmbedSuccessResponse" })

export type PlaylistCreateBody = z.infer<typeof playlistCreateBodySchema>
export type PlaylistUpdateBody = z.infer<typeof playlistUpdateBodySchema>
export type PlaylistVideosUpdateBody = z.infer<
  typeof playlistVideosUpdateBodySchema
>
export type PlaylistSummaryDto = z.infer<typeof playlistSummaryDtoSchema>
export type PlaylistDto = z.infer<typeof playlistDtoSchema>
export type PlaylistEmbedDto = z.infer<typeof playlistEmbedDtoSchema>
