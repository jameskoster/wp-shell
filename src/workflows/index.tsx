import type { ContextType } from "@/contexts/types"
import { AddProduct } from "./AddProduct"
import { EditPage } from "./EditPage"
import { Settings } from "./Settings"

const REGISTRY: Record<ContextType, () => React.JSX.Element> = {
  "add-product": AddProduct,
  "edit-page": EditPage,
  settings: Settings,
}

export function ContextSurface({ type }: { type: ContextType }) {
  const Component = REGISTRY[type]
  return <Component />
}

export { Dashboard } from "./Dashboard"
