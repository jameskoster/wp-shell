import { Star } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"

export function ProductReviews() {
  return (
    <StubWorkflow
      title="Product reviews"
      description="Customer reviews and ratings across your catalog. Moderate, respond, and surface highlights."
      icon={Star}
    />
  )
}
