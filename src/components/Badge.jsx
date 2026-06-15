const variants = {
  ok:      { bg: '#EAF3DE', color: '#3B6D11' },
  warn:    { bg: '#FAEEDA', color: '#854F0B' },
  ng:      { bg: '#FCEBEB', color: '#A32D2D' },
  info:    { bg: '#E6F1FB', color: '#185FA5' },
  gray:    { bg: '#F1EFE8', color: '#5F5E5A' },
  teal:    { bg: '#E1F5EE', color: '#0F6E56' },
}

export function Badge({ variant = 'gray', children, style }) {
  const v = variants[variant] || variants.gray
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 500,
      background: v.bg,
      color: v.color,
      ...style,
    }}>
      {children}
    </span>
  )
}

export function statusVariant(diffDays) {
  if (diffDays === null || diffDays === undefined) return 'gray'
  if (diffDays < 0) return 'ng'
  if (diffDays <= 7) return 'warn'
  if (diffDays <= 30) return 'warn'
  return 'ok'
}

export function statusLabel(diffDays) {
  if (diffDays === null || diffDays === undefined) return '未実施'
  if (diffDays < 0) return `超過 ${Math.abs(diffDays)}日`
  if (diffDays <= 7) return `${diffDays}日以内`
  if (diffDays <= 30) return `${diffDays}日後`
  return '正常'
}
