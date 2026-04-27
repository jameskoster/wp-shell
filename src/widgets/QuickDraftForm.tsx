import { useState, type FormEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/**
 * Compose form for the WordPress "Quick draft" widget. Slots into
 * `InfoWidget`'s `render` escape hatch — the host card supplies its
 * own header (title + icon). Layout: title input on top, content
 * textarea filling the remaining space, primary action pinned to the
 * bottom-right so the button never drifts as the textarea grows.
 *
 * Submission is a no-op for the prototype: pressing Create draft just
 * clears the fields, mirroring the visual outcome of "draft saved" on
 * a real install where the list of pending drafts is rendered by a
 * separate widget.
 */
export function QuickDraftForm() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const canSubmit = title.trim().length > 0 || content.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    setTitle("")
    setContent("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-2">
      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        size="sm"
        aria-label="Draft title"
      />
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.currentTarget.value)}
        size="sm"
        aria-label="Draft content"
      />
      <div className="mt-auto flex justify-end pt-1">
        <Button type="submit" size="sm" disabled={!canSubmit}>
          Create draft
        </Button>
      </div>
    </form>
  )
}

/**
 * Recipe-friendly wrapper. Same rationale as `renderSiteHealth`:
 * keeps `recipes/admin.ts` on the data side of Vite's Fast Refresh
 * boundary so HMR doesn't drop unrelated icon bindings between edits.
 */
export function renderQuickDraft(): ReactNode {
  return <QuickDraftForm />
}
