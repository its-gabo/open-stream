import * as React from "react"
import { cn } from "cn"
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

type FileDropzoneProps = {
  id: string
  /** Files the picker offers, as in `<input accept>`; dropped files are not filtered. */
  accept?: string
  file: File | null
  onFileChange: (file: File | null) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Shown under the chosen file's name, e.g. its size. */
  fileDetails?: React.ReactNode
  removeLabel: string
  invalid?: boolean
  disabled?: boolean
  className?: string
}

/** A single-file picker that also accepts a file dropped onto it. */
function FileDropzone({
  id,
  accept,
  file,
  onFileChange,
  title,
  description,
  fileDetails,
  removeLabel,
  invalid = false,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const clearFile = () => {
    if (inputRef.current) inputRef.current.value = ""

    onFileChange(null)
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const droppedFile = event.dataTransfer.files.item(0)

    if (droppedFile) onFileChange(droppedFile)
  }

  if (file) {
    return (
      <div
        data-slot="file-dropzone"
        aria-invalid={invalid || undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-muted/30 p-3 aria-invalid:border-destructive",
          className
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          {fileDetails && (
            <p className="text-xs text-muted-foreground">{fileDetails}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={removeLabel}
          disabled={disabled}
          onClick={clearFile}
        >
          <XIcon />
        </Button>
      </div>
    )
  }

  return (
    <label
      htmlFor={id}
      data-slot="file-dropzone"
      data-dragging={isDragging || undefined}
      aria-invalid={invalid || undefined}
      aria-disabled={disabled || undefined}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors outline-none hover:bg-muted/40 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive data-dragging:border-primary data-dragging:bg-primary/5",
        className
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UploadCloudIcon className="size-5" />
      </span>
      <span className="text-sm font-medium">{title}</span>
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => onFileChange(event.target.files?.item(0) ?? null)}
      />
    </label>
  )
}

export { FileDropzone }
