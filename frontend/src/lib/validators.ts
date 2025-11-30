export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const isStrongPassword = (v: string) => v.length >= 8
export const matchPassword = (a: string, b: string) => a === b

