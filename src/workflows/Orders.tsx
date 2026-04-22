import { ShoppingBag } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function Orders({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow
      title="Orders"
      description="Track, fulfill, and manage incoming orders. This is a singleton workspace — opening it again focuses the existing one."
      icon={ShoppingBag}
      ctx={ctx}
    />
  )
}
