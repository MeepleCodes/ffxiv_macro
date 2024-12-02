import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/analysis/$reportID/$fightID/events')({
  component: () => <div>Hello /analysis/$reportID/$fightID/events!</div>
})