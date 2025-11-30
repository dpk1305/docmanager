import { ButtonHTMLAttributes } from 'react'

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`btn ${props.className || ''}`}>{props.children}</button>
}

