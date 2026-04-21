import { Megaphone } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"

export function Marketing() {
  return (
    <StubWorkflow
      title="Marketing"
      description="Run campaigns, manage promotions, and reach customers across email and social."
      icon={Megaphone}
    />
  )
}
