export function Toast({ toast }) {
  if (!toast) return null
  const bg = toast.type === 'error' ? '#A32D2D' : '#185FA5'
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: bg,
      color: '#fff',
      padding: '10px 18px',
      borderRadius: 8,
      fontSize: 13,
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,.15)',
    }}>
      {toast.message}
    </div>
  )
}
