import Input from './ui/Input'
import Button from './ui/Button'

export default function AuthForm({ mode, onSubmit, loading }: { mode: 'login' | 'register'; onSubmit: (data: Record<string, string>) => void; loading?: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onSubmit(Object.fromEntries(f) as any) }} className="grid gap-3 max-w-sm">
      {mode === 'register' && <Input name="name" placeholder="Name" aria-label="Name" />}
      <Input name="email" placeholder="Email" aria-label="Email" />
      <Input name="password" type="password" placeholder="Password" aria-label="Password" />
      {mode === 'register' && <Input name="confirm" type="password" placeholder="Confirm Password" aria-label="Confirm Password" />}
      {mode === 'login' && <Input name="code" placeholder="2FA code (if enabled)" aria-label="2FA code" />}
      <Button disabled={!!loading} type="submit">{mode === 'login' ? 'Login' : 'Register'}</Button>
    </form>
  )
}

