import { Settings as SettingsIcon } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"

export function Settings() {
  return (
    <StubWorkflow
      title="Settings"
      description="Settings is a singleton context — opening it twice focuses the existing one rather than duplicating it."
      icon={SettingsIcon}
    />
  )
}
