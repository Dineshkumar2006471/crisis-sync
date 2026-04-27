'use client'
// components/RoleBadge.tsx

const ROLE_COLORS: Record<string, string> = {
  front_desk: '#3B82F6',
  security: '#FF8C00',
  housekeeping: '#00E676',
  management: '#F5A623',
  admin: '#9333EA',
}

const ROLE_LABELS: Record<string, string> = {
  front_desk: 'FRONT DESK',
  security: 'SECURITY',
  housekeeping: 'HOUSEKEEPING',
  management: 'MANAGEMENT',
  admin: 'ADMIN',
}

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const color = ROLE_COLORS[role] || 'var(--text-muted)'

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
        border: `1px solid ${color}`,
        padding: '2px 8px',
        borderRadius: '4px',
        background: `${color}18`,
      }}
    >
      {ROLE_LABELS[role] || role.toUpperCase()}
    </span>
  )
}
