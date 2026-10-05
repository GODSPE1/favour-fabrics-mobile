import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useCart } from '@/lib/cart'
import { formatNaira } from '@/lib/format'
import { colors, radius } from '@/lib/theme'
import type { Product } from '@/lib/types'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    api
      .get(`/api/products/${id}`)
      .then((d) => !cancelled && setProduct(d as Product))
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.pink} />
      </View>
    )
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Product not found'}</Text>
        <Button title="Back to shop" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    )
  }

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        gender: product.gender,
      },
      qty
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        </View>

        <Text style={styles.category}>{product.category} fabrics</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatNaira(product.price)}</Text>
        <Text style={styles.desc}>{product.description || 'No description available.'}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.qtyRow}>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Ionicons name="remove" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.qtyText}>{qty}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
            <Ionicons name="add" size={18} color={colors.text} />
          </Pressable>
        </View>
        <Button
          title={added ? 'Added ✓' : 'Add to cart'}
          onPress={handleAdd}
          style={styles.addButton}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  error: { color: colors.danger },
  scroll: { paddingBottom: 24 },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.ink2,
  },
  image: { width: '100%', height: '100%' },
  back: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    marginTop: 20,
    marginHorizontal: 16,
    color: colors.rose,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  name: { marginTop: 8, marginHorizontal: 16, color: colors.text, fontSize: 26, fontWeight: '700' },
  price: { marginTop: 10, marginHorizontal: 16, color: colors.pink, fontSize: 22, fontWeight: '700' },
  desc: { marginTop: 16, marginHorizontal: 16, color: colors.muted, fontSize: 15, lineHeight: 22 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.ink2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
  },
  qtyBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  qtyText: { width: 28, textAlign: 'center', color: colors.text, fontWeight: '600' },
  addButton: { flex: 1 },
})
