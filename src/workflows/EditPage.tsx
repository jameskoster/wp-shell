import { FileEdit } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import { useActiveContext } from "@/contexts/store"

export function EditPage() {
  const ctx = useActiveContext()
  const id = ctx?.params?.id ?? "untitled"
  return (
    <StubWorkflow
      title={`Edit page — ${id}`}
      description="The block editor would render here. Each edit-page context has its own params, so you can keep several open at once."
      icon={FileEdit}
      hint="Edit pages are non-singleton — open another from the command palette."
    />
  )
}
