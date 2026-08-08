interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-text-primary font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-text-secondary text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
