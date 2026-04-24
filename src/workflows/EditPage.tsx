import { FileEdit } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function EditPage({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow
      title={ctx.title}
      icon={ctx.icon ?? FileEdit}
      ctx={ctx}
    />
  )
}
