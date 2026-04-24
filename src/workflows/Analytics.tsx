import { BarChart3 } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function Analytics({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow title="Analytics" icon={BarChart3} ctx={ctx} />
  )
}
