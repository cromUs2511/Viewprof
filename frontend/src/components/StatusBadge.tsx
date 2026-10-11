/** Status indicator badge */
interface StatusBadgeProps {
  status: 'fresh' | 'stale' | 'error' | 'idle' | 'running' | 'completed' | 'partial' | 'failed'
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const config: Record<string, { class: string; text: string; icon: string }> = {
    fresh: { class: 'badge-fresh', text: 'Fresh', icon: '✓' },
    completed: { class: 'badge-fresh', text: 'Completed', icon: '✓' },
    stale: { class: 'badge-stale', text: 'Stale', icon: '⏱' },
    partial: { class: 'badge-stale', text: 'Partial', icon: '⚠' },
    error: { class: 'badge-error', text: 'Error', icon: '✕' },
    failed: { class: 'badge-error', text: 'Failed', icon: '✕' },
    idle: { class: 'badge-idle', text: 'Idle', icon: '○' },
    running: { class: 'badge-running', text: 'Running', icon: '⟳' },
  }

  const cfg = config[status] || config.idle

  return (
    <span className={`badge ${cfg.class} ${className}`} aria-label={label || cfg.text}>
      <span aria-hidden="true">{cfg.icon}</span>
      <span>{label || cfg.text}</span>
    </span>
  )
}