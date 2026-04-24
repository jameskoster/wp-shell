import { ShoppingBag } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function Orders({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow title="Orders" icon={ShoppingBag} ctx={ctx} />
  )
}
