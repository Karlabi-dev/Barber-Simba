import { useId, useState } from 'react'

export default function PasswordInput({ label, ...props }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return <div className={label ? 'password-field password-field-labeled' : 'password-field'}>
    {label && <label htmlFor={id}>{label}</label>}
    <div className="password-control">
      <input {...props} id={id} type={visible ? 'text' : 'password'} />
      <button className="password-toggle" type="button" disabled={props.disabled}
        aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label || 'senha'}`}
        aria-controls={id} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  </div>
}
