import { Star } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function ProductReviews({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow
      title="Product reviews"
      description="Customer reviews and ratings across your catalog. Moderate, respond, and surface highlights."
      icon={Star}
      ctx={ctx}
    />
  )
}
