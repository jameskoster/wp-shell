import { Megaphone } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function Marketing({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow title="Marketing" icon={Megaphone} ctx={ctx} />
  )
}
