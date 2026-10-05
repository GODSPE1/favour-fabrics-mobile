import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/auth'
import { colors, radius } from '@/lib/theme'

export default function AccountScreen() {
  const { user, loading, isAdmin, signOut } = useAuth()

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={56} color={colors.muted} />
        <Text style={styles.title}>Welcome to Favour Fabrics</Text>
        <Text style={styles.muted}>Sign in to sync your cart and track orders.</Text>
        <Button title="Sign in" onPress={() => router.push('/login')} style={{ marginTop: 20 }} />
      </View>
    )
  }

  const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string)

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Account</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name || user.email || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {name ? <Text style={styles.name}>{name}</Text> : null}
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      {isAdmin && (
        <Button
          title="Admin · Product management"
          variant="outline"
          onPress={() => router.push('/(tabs)')}
          style={{ marginTop: 12 }}
        />
      )}

      <Button
        title="Sign out"
        variant="outline"
        onPress={signOut}
        style={{ marginTop: 12 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 16, paddingTop: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 32,
  },
  heading: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  muted: { color: colors.muted, marginTop: 6, textAlign: 'center' },
  title: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  email: { color: colors.muted, fontSize: 13, marginTop: 2 },
})
