import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock axios.create to control POST calls
const postMock = vi.fn(async () => ({ data: {} }))
vi.mock('axios', () => ({
  default: {
    create: () => ({ post: postMock }),
  },
}))

import AuthPages from './Auth'

describe('AuthPages', () => {
  beforeEach(() => {
    postMock.mockClear()
  })

  it('submits register with name, email, password', async () => {
    render(<AuthPages />)
    const nameInput = screen.getAllByPlaceholderText('Name')[0]
    const emailInput = screen.getAllByPlaceholderText('Email')[0]
    const passwordInput = screen.getAllByPlaceholderText('Password')[0]
    await userEvent.clear(nameInput)
    await userEvent.clear(emailInput)
    await userEvent.clear(passwordInput)
    await userEvent.type(nameInput, 'Alice')
    await userEvent.type(emailInput, 'alice@example.com')
    await userEvent.type(passwordInput, 'secret')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    expect(postMock).toHaveBeenCalledWith('/auth/register', {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret',
    })
  })

  it('submits login with email, password and optional 2FA code', async () => {
    render(<AuthPages />)
    const emailInput = screen.getAllByPlaceholderText('Email')[0]
    const passwordInput = screen.getAllByPlaceholderText('Password')[0]
    const codeInput = screen.getAllByPlaceholderText('2FA code (if enabled)')[0]
    await userEvent.clear(emailInput)
    await userEvent.clear(passwordInput)
    await userEvent.type(emailInput, 'bob@example.com')
    await userEvent.type(passwordInput, 'secret')
    await userEvent.type(codeInput, '123456')
    const loginBtn = screen.getAllByRole('button', { name: /login/i })[0]
    await userEvent.click(loginBtn)

    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      email: 'bob@example.com',
      password: 'secret',
      code: '123456',
    })
  })
})
