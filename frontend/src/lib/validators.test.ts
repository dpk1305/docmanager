import { describe, it, expect } from 'vitest'
import { isEmail, isStrongPassword, matchPassword } from './validators'

describe('validators', () => {
  it('email validator', () => {
    expect(isEmail('a@b.com')).toBe(true)
    expect(isEmail('bad')).toBe(false)
  })
  it('password strength', () => {
    expect(isStrongPassword('12345678')).toBe(true)
    expect(isStrongPassword('123')).toBe(false)
  })
  it('match password', () => {
    expect(matchPassword('a', 'a')).toBe(true)
    expect(matchPassword('a', 'b')).toBe(false)
  })
})

