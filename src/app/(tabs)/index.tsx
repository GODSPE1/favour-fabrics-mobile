import { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ProductCard } from '@/components/ProductCard'
import { listProducts } from '@/lib/products'
import { useCart } from '@/lib/cart'
import { colors, radius } from '@/lib/theme'
import type { Product } from '@/lib/types'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'kids', label: 'Kids' },
]

export default function ShopScreen() {
  const { addItem, itemCount } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (cat: string) => {
    setError(null)
    try {
      setProducts(await listProducts(cat || undefined))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      await load(category)
      if (!cancelled) setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [category, load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(category)
    setRefreshing(false)
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>
            Favour <Text style={{ color: colors.pink }}>Fabrics</Text>
          </Text>
          <Text style={styles.sub}>Premium fabrics, delivered</Text>
        </View>
        <Pressable style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="bag-handle-outline" size={22} color={colors.text} />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.filters}>
        {CATEGORIES.map((c) => {
          const active = category === c.value
          return (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
            >
              <Text style={[styles.pillText, { color: active ? colors.white : colors.muted }]}>
                {c.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => load(category)} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading products…</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.mutedText}>No products found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onAdd={() =>
                addItem({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image_url: item.image_url,
                  category: item.category,
                  gender: item.gender,
                })
              }
            />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 16, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brand: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  pillActive: { backgroundColor: colors.pink },
  pillIdle: { borderWidth: 1, borderColor: colors.border },
  pillText: { fontSize: 13, fontWeight: '600' },
  list: { paddingBottom: 32, gap: 14 },
  row: { gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  mutedText: { color: colors.muted },
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: 12 },
  retry: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.pink,
  },
  retryText: { color: colors.white, fontWeight: '600' },
})
