import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeader()),
      ...(options.headers as Record<string, string> | undefined),
    },
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = (data as { detail?: string; error?: string }).detail
    throw new Error(detail || (data as { error?: string }).error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path: string, body?: unknown) =>
    request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
}
