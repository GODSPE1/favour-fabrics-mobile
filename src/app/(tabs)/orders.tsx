import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'
import { colors, radius } from '@/lib/theme'
import type { Order } from '@/lib/types'

export default function OrdersScreen() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setOrders(data as Order[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      await load()
      if (!cancelled) setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [authLoading, load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!authLoading && !user) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={44} color={colors.muted} />
        <Text style={styles.title}>Sign in to view orders</Text>
        <Button title="Sign in" onPress={() => router.push('/login')} style={{ marginTop: 18 }} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Orders</Text>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>No orders yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                <View style={[styles.status, item.payment_status === 'paid' ? styles.paid : styles.pending]}>
                  <Text style={styles.statusText}>{item.payment_status}</Text>
                </View>
              </View>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.items} numberOfLines={2}>
                {(item.items || []).map((i) => `${i.name} ×${i.quantity}`).join(', ')}
              </Text>
              <Text style={styles.total}>{formatNaira(item.total_amount)}</Text>
            </View>
          )}
        />
      )}
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
  heading: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 14 },
  muted: { color: colors.muted },
  title: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 14 },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: colors.text, fontWeight: '700' },
  status: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  paid: { backgroundColor: 'rgba(52,211,153,0.15)' },
  pending: { backgroundColor: 'rgba(244,114,182,0.15)' },
  statusText: { color: colors.text, fontSize: 11, textTransform: 'capitalize' },
  date: { color: colors.faint, fontSize: 12, marginTop: 6 },
  items: { color: colors.muted, fontSize: 13, marginTop: 8 },
  total: { color: colors.pink, fontWeight: '700', fontSize: 16, marginTop: 10 },
})
