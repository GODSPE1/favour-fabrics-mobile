import React, { createContext, useContext, useEffect, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { makeRedirectUri } from 'expo-auth-session'
import * as QueryParams from 'expo-auth-session/build/QueryParams'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

WebBrowser.maybeCompleteAuthSession()

const redirectTo = makeRedirectUri()

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ needsConfirmation: boolean }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Extract a session from the OAuth redirect URL (implicit flow). */
async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url)
  if (errorCode) throw new Error(errorCode)
  const { access_token, refresh_token } = params
  if (!access_token) return null
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? '',
  })
  if (error) throw error
  return data.session
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Handle the app being opened via the OAuth redirect (deep link)
  const url = Linking.useLinkingURL()
  useEffect(() => {
    if (!url || url.includes('error')) return
    if (url.includes('access_token')) {
      createSessionFromUrl(url).catch((e) => console.error('[auth] deep link failed', e))
    }
  }, [url])

  // Resolve admin flag for the signed-in user
  useEffect(() => {
    const uid = session?.user?.id
    let cancelled = false
    const run = async () => {
      if (!uid) {
        setIsAdmin(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', uid)
        .single()
      if (!cancelled) setIsAdmin(Boolean(data?.is_admin))
    }
    run()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error) throw error

    const res = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectTo)
    if (res.type === 'success') {
      await createSessionFromUrl(res.url)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        isAdmin,
        signInWithPassword,
        signUpWithPassword,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
