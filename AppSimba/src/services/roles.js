export function roleFromClaims(claims = {}) {
  if (claims.admin === true) return 'admin'
  if (claims.professional === true) return 'profissional'
  return 'cliente'
}

export function homeForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'profissional') return '/profissional'
  return '/home'
}
