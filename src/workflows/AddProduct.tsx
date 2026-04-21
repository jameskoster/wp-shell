import { PackagePlus } from "lucide-react"
import { StubWorkflow } from "./StubWorkflow"

export function AddProduct() {
  return (
    <StubWorkflow
      title="Add product"
      description="This is where the product editor would live. In slice 1 it's a placeholder so we can prove the shell, switching, and entry-points end-to-end."
      icon={PackagePlus}
      hint="Try opening multiple contexts and switching between them."
    />
  )
}
