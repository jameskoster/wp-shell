import { Settings as SettingsIcon } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function Settings({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow
      title="Settings"
      description="Settings is a singleton workspace — opening it twice focuses the existing one rather than duplicating it."
      icon={SettingsIcon}
      ctx={ctx}
    />
  )
}
