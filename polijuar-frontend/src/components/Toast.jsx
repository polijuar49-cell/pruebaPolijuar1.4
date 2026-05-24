import { useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  return { toasts, show }
}

export function ToastContainer({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#3d1a1a' : '#1a2d1a',
          border: `1px solid ${t.type === 'error' ? '#e05252' : '#4cba7f'}`,
          color: t.type === 'error' ? '#e05252' : '#4cba7f',
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          animation: 'slideIn .2s ease',
          maxWidth: 320,
        }}>
          {t.type === 'error' ? '✕ ' : '✓ '}{t.msg}
        </div>
      ))}
    </div>
  )
}
