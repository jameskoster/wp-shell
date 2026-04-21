import type { Context, ContextType } from "@/contexts/types"
import { AddProduct } from "./AddProduct"
import { Analytics } from "./Analytics"
import { EditPage } from "./EditPage"
import { Editor } from "./Editor"
import { Marketing } from "./Marketing"
import { Orders } from "./Orders"
import { Pages } from "./Pages"
import { ProductReviews } from "./ProductReviews"
import { Settings } from "./Settings"

const REGISTRY: Record<ContextType, (props: { ctx: Context }) => React.JSX.Element> = {
  "add-product": AddProduct,
  "edit-page": EditPage,
  settings: Settings,
  orders: Orders,
  "product-reviews": ProductReviews,
  marketing: Marketing,
  analytics: Analytics,
  pages: Pages,
  editor: Editor,
}

export function ContextSurface({ ctx }: { ctx: Context }) {
  const Component = REGISTRY[ctx.type]
  return <Component ctx={ctx} />
}

export { Dashboard } from "./Dashboard"
