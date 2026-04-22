import { FileEdit } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function EditPage({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow
      title={ctx.title}
      description="The block editor would render here. Each edit-page workspace has its own params, so you can keep several open at once."
      icon={ctx.icon ?? FileEdit}
      hint="Edit pages are non-singleton — open another from the command palette."
    />
  )
}
