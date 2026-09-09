import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/book-appointment')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/book-appointment"!</div>
}
