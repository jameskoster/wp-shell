import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { ContextHeader } from "@/shell/ContextHeader"
import type { Context } from "@/contexts/types"
import type { LucideIcon } from "lucide-react"

type Props = {
  title: string
  description: string
  icon: LucideIcon
  hint?: string
  ctx?: Context
}

export function StubWorkflow({ title, description, icon: Icon, hint, ctx }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <ContextHeader ctx={ctx}>
        <ContextHeader.Title icon={Icon}>{title}</ContextHeader.Title>
      </ContextHeader>
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
