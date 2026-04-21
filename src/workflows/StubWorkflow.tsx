import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import type { LucideIcon } from "lucide-react"

type Props = {
  title: string
  description: string
  icon: LucideIcon
  hint?: string
}

export function StubWorkflow({ title, description, icon: Icon, hint }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b px-8 py-5">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-heading font-semibold">{title}</h1>
        </div>
      </header>
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {hint ? (
          <EmptyContent>
            <p className="text-muted-foreground text-xs">{hint}</p>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
              <span className="text-muted-foreground">to jump elsewhere</span>
            </KbdGroup>
          </EmptyContent>
        ) : null}
      </Empty>
    </div>
  )
}
