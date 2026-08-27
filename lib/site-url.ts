/**
 * Trả về URL gốc canonical của site.
 * - Ưu tiên NEXT_PUBLIC_SITE_URL nếu được set (deploy production).
 * - Nếu không, dùng dựa trên môi trường Vercel.
 * - Fallback về localhost cho dev.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}
