/**
 * Product images are served by the web app: Supabase stores relative paths
 * (e.g. "/products/ankara-royal-indigo.svg"), but a native app needs an
 * absolute URL. External URLs (e.g. Unsplash) are passed through untouched.
 */
const WEB_URL = (
  process.env.EXPO_PUBLIC_WEB_URL ?? 'https://favour-fabrics.vercel.app'
).replace(/\/+$/, '')

export function resolveImageUrl(url?: string | null): string {
  if (!url) return `${WEB_URL}/placeholder.svg`
  if (/^https?:\/\//i.test(url)) return url
  return `${WEB_URL}${url.startsWith('/') ? '' : '/'}${url}`
}
