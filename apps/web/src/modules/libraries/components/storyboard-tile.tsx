import { cn } from "@workspace/ui/lib/utils"

import type { StoryboardCue } from "../libraries.types"

type StoryboardTileProps = {
  cue: StoryboardCue
  /** Scales the tile to this width; its own size when left out. */
  width?: number
  className?: string
}

/** One tile of the storyboard sprite, e.g. a seek preview or a chapter's thumbnail. */
export function StoryboardTile({ cue, width, className }: StoryboardTileProps) {
  const scale = width ? width / cue.width : 1

  return (
    <div
      aria-hidden
      className={cn("shrink-0 overflow-hidden bg-black", className)}
      style={{ width: cue.width * scale, height: cue.height * scale }}
    >
      <div
        className="origin-top-left bg-no-repeat"
        style={{
          width: cue.width,
          height: cue.height,
          transform: `scale(${scale})`,
          backgroundImage: `url("${cue.imageUrl}")`,
          backgroundPosition: `-${cue.x}px -${cue.y}px`,
        }}
      />
    </div>
  )
}
