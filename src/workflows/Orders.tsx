import { ShoppingBag } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"

export function Orders() {
  return (
    <StubWorkflow
      title="Orders"
      description="Track, fulfill, and manage incoming orders. This is a singleton context — opening it again focuses the existing one."
      icon={ShoppingBag}
    />
  )
}
