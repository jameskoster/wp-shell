import { PackagePlus } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"
import type { Context } from "@/contexts/types"

export function AddProduct({ ctx }: { ctx: Context }) {
  return (
    <StubWorkflow
      title="Add product"
      icon={PackagePlus}
      hint="Try opening multiple workspaces and switching between them."
      ctx={ctx}
    />
  )
}
