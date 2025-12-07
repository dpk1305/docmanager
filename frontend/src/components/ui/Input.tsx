import { InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const isPassword = props.type === 'password'
  const [show, setShow] = useState(false)
  if (!isPassword) {
    return <input {...props} className={`input ${props.className || ''}`} />
  }
  const { className, ...rest } = props
  return (
    <div className="relative">
      <input {...rest} type={show ? 'text' : 'password'} className={`input pr-10 ${className || ''}`} />
      <button type="button" aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text" onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
