import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import {
  CircleAlertIcon,
  ClockIcon,
  GripVerticalIcon,
  ListVideoIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { PLAYLIST_VIDEO_STATES } from "../libraries.constants"
import { toPlaylistVideoState } from "../libraries.utils"
import { VideoThumbnail } from "./video-thumbnail"

import type { DragEndEvent } from "@dnd-kit/core"
import type { Playlist, Video } from "@/api/generated-api"

import { usePlaylistVideosUpdateMutation } from "@/api/mutations/libraries/usePlaylistVideosUpdateMutation"
import { useLibraryVideosQuery } from "@/api/queries/libraries/useLibraryVideosQuery"

type PlaylistVideosEditorProps = {
  organizationSlug: string
  libraryId: string
  playlist: Playlist
}

/**
 * The playlist's videos in playback order, to reorder by dragging their
 * handles (or with the keyboard on a focused handle), remove, and add to from
 * the library; every change is saved right away. Videos still processing
 * stay in the list, and players skip them until they are ready.
 */
export function PlaylistVideosEditor({
  organizationSlug,
  libraryId,
  playlist,
}: PlaylistVideosEditorProps) {
  const { t } = useTranslation()
  const { mutate: saveVideos } = usePlaylistVideosUpdateMutation(
    organizationSlug,
    libraryId,
    playlist.id
  )
  // Dropped rows take their place at once; the saved playlist replaces this order when it arrives.
  const [videos, setVideos] = useState(playlist.videos)

  useEffect(() => setVideos(playlist.videos), [playlist.videos])
  const failedCount = videos.filter(
    (video) => toPlaylistVideoState(video) === PLAYLIST_VIDEO_STATES.FAILED
  ).length
  const waitingCount = videos.filter(
    (video) => toPlaylistVideoState(video) === PLAYLIST_VIDEO_STATES.WAITING
  ).length
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const moveDraggedVideo = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const reordered = arrayMove(
      videos,
      videos.findIndex(({ id }) => id === active.id),
      videos.findIndex(({ id }) => id === over.id)
    )

    setVideos(reordered)
    saveVideos(reordered)
  }

  return (
    <section className="flex flex-col gap-3">
      {failedCount > 0 && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>
            {t("playlists.videos.failed_title", { count: failedCount })}
          </AlertTitle>
          <AlertDescription>
            {t("playlists.videos.failed_hint", { count: failedCount })}
          </AlertDescription>
        </Alert>
      )}
      {waitingCount > 0 && (
        <Alert>
          <ClockIcon />
          <AlertTitle>
            {t("playlists.videos.waiting_title", { count: waitingCount })}
          </AlertTitle>
          <AlertDescription>
            {t("playlists.videos.waiting_hint", { count: waitingCount })}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <AddVideosPopover
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          playlistVideoIds={new Set(videos.map(({ id }) => id))}
          onAdd={(video) => saveVideos([...videos, video])}
        />
      </div>
      {videos.length === 0 ? (
        <Empty className="min-h-48 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListVideoIcon />
            </EmptyMedia>
            <EmptyTitle>{t("playlists.videos.empty.title")}</EmptyTitle>
            <EmptyDescription>
              {t("playlists.videos.empty.description")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={moveDraggedVideo}
        >
          <SortableContext
            items={videos.map(({ id }) => id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col divide-y rounded-lg border">
              {videos.map((video, index) => (
                <SortableVideoRow
                  key={video.id}
                  organizationSlug={organizationSlug}
                  libraryId={libraryId}
                  video={video}
                  position={index + 1}
                  onRemove={() =>
                    saveVideos(videos.filter(({ id }) => id !== video.id))
                  }
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}

/** A video of the playlist, dragged by its handle only, so the rest of the row stays clickable. */
function SortableVideoRow({
  organizationSlug,
  libraryId,
  video,
  position,
  onRemove,
}: {
  organizationSlug: string
  libraryId: string
  video: Video
  position: number
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2",
        isDragging &&
          "z-10 rounded-lg bg-background shadow-lg ring-1 ring-border"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={t("playlists.videos.drag_handle", { title: video.title })}
        title={t("playlists.videos.drag_handle", { title: video.title })}
        className={cn(
          "flex size-7 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <span className="w-5 shrink-0 text-right text-sm font-medium text-muted-foreground tabular-nums">
        {position}
      </span>
      <VideoThumbnail
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        video={video}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{video.title}</span>
        {match(toPlaylistVideoState(video))
          .with(PLAYLIST_VIDEO_STATES.READY, () => null)
          .with(PLAYLIST_VIDEO_STATES.WAITING, () => (
            <Badge variant="secondary" className="mt-0.5 w-fit">
              {t("playlists.videos.not_ready")}
            </Badge>
          ))
          .with(PLAYLIST_VIDEO_STATES.FAILED, () => (
            <Badge variant="destructive" className="mt-0.5 w-fit">
              {t("playlists.videos.failed")}
            </Badge>
          ))
          .exhaustive()}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("playlists.videos.remove")}
        title={t("playlists.videos.remove")}
        onClick={onRemove}
      >
        <XIcon />
      </Button>
    </li>
  )
}

/** The library's videos not in the playlist yet, searchable by title; picking one adds it at the end. */
function AddVideosPopover({
  organizationSlug,
  libraryId,
  playlistVideoIds,
  onAdd,
}: {
  organizationSlug: string
  libraryId: string
  playlistVideoIds: Set<string>
  onAdd: (video: Video) => void
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const { data: libraryVideos = [] } = useLibraryVideosQuery(
    organizationSlug,
    libraryId
  )
  const normalizedSearch = search.trim().toLowerCase()
  const addable = libraryVideos.filter(
    (video) =>
      !playlistVideoIds.has(video.id) &&
      video.title.toLowerCase().includes(normalizedSearch)
  )

  return (
    <Popover>
      <PopoverTrigger render={<Button size="sm" variant="outline" />}>
        <PlusIcon />
        {t("playlists.videos.add")}
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-2 p-2">
        <Input
          value={search}
          placeholder={t("playlists.videos.search_placeholder")}
          aria-label={t("playlists.videos.search_placeholder")}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="flex max-h-72 flex-col overflow-y-auto">
          {addable.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t("playlists.videos.none_to_add")}
            </p>
          )}
          {addable.map((video) => (
            <button
              key={video.id}
              type="button"
              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => onAdd(video)}
            >
              <VideoThumbnail
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                video={video}
              />
              <span className="min-w-0 flex-1 truncate">{video.title}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
