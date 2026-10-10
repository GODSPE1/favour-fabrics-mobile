import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { formatNaira } from '@/lib/format'
import { resolveImageUrl } from '@/lib/images'
import { colors, radius } from '@/lib/theme'
import type { Product } from '@/lib/types'

export function ProductCard({
  product,
  onAdd,
  width,
}: {
  product: Product
  onAdd: () => void
  width?: number
}) {
  return (
    <Pressable
      style={[styles.card, width ? { width } : null]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: resolveImageUrl(product.image_url) }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{product.category}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={onAdd} hitSlop={10}>
          <Ionicons name="add" size={18} color="#000" />
        </Pressable>
      </View>
      <Text numberOfLines={1} style={styles.name}>
        {product.name}
      </Text>
      <Text style={styles.price}>{formatNaira(product.price)}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  imageWrap: {
    aspectRatio: 4 / 5,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.ink2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, textTransform: 'uppercase' },
  addBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: 8, color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
  price: { marginTop: 2, color: colors.pink, fontSize: 13, fontWeight: '700' },
})
