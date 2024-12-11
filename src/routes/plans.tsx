import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/plans')({
  component: () => <div>Hello /plans!</div>
})