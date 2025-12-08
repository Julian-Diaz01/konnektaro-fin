const AUTH_COOKIE_NAME = 'auth-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function setAuthCookie (token: string) {
  if (typeof document === 'undefined') return

  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`
}

export function removeAuthCookie () {
  if (typeof document === 'undefined') return

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax; Secure`
}

export function getAuthCookie (): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie =>
    cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`)
  )

  if (!authCookie) return null

  return authCookie.split('=')[1] || null
}
