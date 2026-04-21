export type MockNotification = {
  id: string
  title: string
  body: string
  unread: boolean
  time: string
}

export const NOTIFICATIONS: MockNotification[] = [
  {
    id: "n1",
    title: "Order #1284 received",
    body: "A new order from Sarah K. is awaiting fulfillment.",
    unread: true,
    time: "2m ago",
  },
  {
    id: "n2",
    title: "Backup complete",
    body: "Daily backup finished successfully.",
    unread: true,
    time: "1h ago",
  },
  {
    id: "n3",
    title: "Plugin update available",
    body: "Yoast SEO 21.4 is ready to install.",
    unread: false,
    time: "Yesterday",
  },
]
