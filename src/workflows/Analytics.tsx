import { BarChart3 } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function Analytics({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow
      title="Analytics"
      description="Site traffic, store performance, and content insights — all in one place."
      icon={BarChart3}
      ctx={ctx}
    />
  )
}
