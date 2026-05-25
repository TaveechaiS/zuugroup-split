// src/lib/api/client.ts
'use client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

const TOKEN_KEY = 'zuugroup_token'
const USER_KEY = 'zuugroup_user'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setStoredUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any
  query?: Record<string, string | number | undefined>
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options
  const token = getToken()

  // Build URL with query string
  let url = `${API_BASE}${path}`
  if (query) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
    })
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearSession()
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth/login'
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  get: <T = any>(path: string, query?: Record<string, any>) =>
    apiRequest<T>(path, { method: 'GET', query }),
  post: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'POST', body }),
  patch: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T = any>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
}
