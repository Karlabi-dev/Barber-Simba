import { useEffect, useRef } from 'react'

export default function AuthDialog({ title, children, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className="auth-dialog" aria-labelledby="auth-dialog-title" onCancel={event => {event.preventDefault(); onClose()}}>
    <h2 id="auth-dialog-title">{title}</h2>
    {children}
    <button autoFocus className="auth-submit" type="button" onClick={onClose}>OK</button>
  </dialog>
}
