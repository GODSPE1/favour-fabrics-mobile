import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/auth'
import { colors, radius } from '@/lib/theme'

export default function LoginScreen() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      await fn()
      router.back()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const onGoogle = () => run(signInWithGoogle)

  const onSubmit = () =>
    run(async () => {
      if (mode === 'signin') {
        await signInWithPassword(email.trim(), password)
      } else {
        const { needsConfirmation } = await signUpWithPassword(email.trim(), password, name.trim())
        if (needsConfirmation) {
          setInfo('Check your email to confirm your account, then sign in.')
        }
      }
    })

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable style={styles.close} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="close" size={22} color={colors.muted} />
      </Pressable>

      <Text style={styles.title}>
        {mode === 'signin' ? 'Welcome back' : 'Create account'}
      </Text>
      <Text style={styles.sub}>
        {mode === 'signin'
          ? 'Sign in to sync your cart across web and mobile.'
          : 'Use the same account on the website and the app.'}
      </Text>

      <Pressable style={styles.google} onPress={onGoogle} disabled={loading}>
        <Ionicons name="logo-google" size={18} color="#000" />
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor={colors.faint}
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.faint}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <Button
        title={mode === 'signin' ? 'Sign in' : 'Create account'}
        onPress={onSubmit}
        loading={loading}
        style={{ marginTop: 8 }}
      />

      <Pressable
        onPress={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin')
          setError(null)
          setInfo(null)
        }}
        style={styles.switch}
      >
        <Text style={styles.switchText}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, padding: 24, paddingTop: 64 },
  close: { position: 'absolute', top: 52, right: 20, zIndex: 2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  sub: { color: colors.muted, marginTop: 8, marginBottom: 24 },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  googleText: { color: '#000', fontWeight: '600', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.faint, fontSize: 12 },
  input: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  error: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  info: { color: colors.success, marginBottom: 8, fontSize: 13 },
  switch: { marginTop: 18, alignItems: 'center' },
  switchText: { color: colors.rose, fontSize: 13 },
})
