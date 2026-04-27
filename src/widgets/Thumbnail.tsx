import type { CSSProperties } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ItemThumbnail } from "./types"

/**
 * Thumbnail for info-list items.
 *
 * Wraps the Avatar primitive's image-with-fallback pattern, swapping
 * border radius per variant (round for people, square for everything
 * else) and deriving sensible `src` defaults so callers usually only
 * need to pass the seed (name / domain / image seed).
 *
 * Fallbacks are deterministic (hashed pastel) and offline-friendly —
 * the widget reads even when image hosts are unreachable.
 */
export function Thumbnail({
  thumbnail,
  className,
}: {
  thumbnail: ItemThumbnail
  className?: string
}) {
  if (thumbnail.kind === "avatar") {
    const seed = thumbnail.name
    const src =
      thumbnail.src ??
      `https://i.pravatar.cc/64?u=${encodeURIComponent(seed)}`
    return (
      <Avatar className={cn("size-7", className)}>
        <AvatarImage src={src} alt="" />
        <AvatarFallback
          className="text-[10px] font-medium"
          style={pastel(seed)}
        >
          {initials(seed)}
        </AvatarFallback>
      </Avatar>
    )
  }

  if (thumbnail.kind === "image") {
    const seed = thumbnail.seed
    const src =
      thumbnail.src ??
      `https://picsum.photos/seed/${encodeURIComponent(seed)}/64/64`
    return (
      <Avatar className={cn("size-7 rounded-md bg-muted", className)}>
        <AvatarImage src={src} alt={thumbnail.alt ?? ""} />
        <AvatarFallback
          className="rounded-md text-[10px] font-medium"
          style={pastel(seed)}
        >
          {seed.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }

  if (thumbnail.kind === "site") {
    const seed = thumbnail.domain
    const src =
      thumbnail.src ??
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(seed)}&sz=64`
    return (
      <Avatar className={cn("size-7 rounded-md bg-muted p-1", className)}>
        <AvatarImage src={src} alt="" className="object-contain" />
        <AvatarFallback
          className="rounded-md text-[10px] font-medium"
          style={pastel(seed)}
        >
          {(thumbnail.label ?? seed).slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }

  const Icon = thumbnail.icon
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Map a seed string to a stable HSL pastel + matching foreground.
 * Used for the offline fallback so each list item still reads as a
 * distinct visual chip when the image host is unreachable.
 */
function pastel(seed: string): CSSProperties {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  const hue = Math.abs(h) % 360
  return {
    background: `hsl(${hue} 55% 88%)`,
    color: `hsl(${hue} 45% 28%)`,
  }
}
