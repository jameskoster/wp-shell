import { Settings as SettingsIcon } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function Settings({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow title="Settings" icon={SettingsIcon} ctx={ctx} />
  )
}
