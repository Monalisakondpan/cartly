import { describe, it, expect } from 'vitest'
import { validatePassword } from './validation'

describe('validatePassword', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('Ab1!')).toBe('Password must be at least 8 characters.')
  })

  it('rejects passwords with no uppercase letter', () => {
    expect(validatePassword('lowercase1!')).toBe('Password must contain an uppercase letter.')
  })

  it('rejects passwords with no lowercase letter', () => {
    expect(validatePassword('UPPERCASE1!')).toBe('Password must contain a lowercase letter.')
  })

  it('rejects passwords with no number', () => {
    expect(validatePassword('NoNumbers!')).toBe('Password must contain a number.')
  })

  it('rejects passwords with no special character', () => {
    expect(validatePassword('NoSpecial123')).toBe('Password must contain a special character.')
  })

  it('accepts a valid password meeting all requirements', () => {
    expect(validatePassword('ValidPass123!')).toBeNull()
  })

  it('checks requirements in order - length checked before character types', () => {
    expect(validatePassword('a')).toBe('Password must be at least 8 characters.')
  })
})