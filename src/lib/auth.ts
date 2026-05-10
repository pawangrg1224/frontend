import crypto from 'crypto'

const SALT = process.env.PASSWORD_SALT ?? 'appointment-management-system-salt'

export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, SALT, 1000, 64, 'sha512')
    .toString('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  const hashOfInput = crypto
    .pbkdf2Sync(password, SALT, 1000, 64, 'sha512')
    .toString('hex')
  return hashOfInput === hash
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateTokenExpiresAt(hours: number = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}
