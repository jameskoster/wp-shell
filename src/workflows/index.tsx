import type { Context, ContextType } from "@/contexts/types"
import { AddProduct } from "./AddProduct"
import { EditPage } from "./EditPage"
import { Settings } from "./Settings"

const REGISTRY: Record<ContextType, (props: { ctx: Context }) => React.JSX.Element> = {
  "add-product": AddProduct,
  "edit-page": EditPage,
  settings: Settings,
}

export function ContextSurface({ ctx }: { ctx: Context }) {
  const Component = REGISTRY[ctx.type]
  return <Component ctx={ctx} />
}

export { Dashboard } from "./Dashboard"
