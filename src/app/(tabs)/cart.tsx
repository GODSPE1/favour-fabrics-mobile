import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { useCart } from '@/lib/cart'
import { formatNaira } from '@/lib/format'
import { colors, radius } from '@/lib/theme'

export default function CartScreen() {
  const { items, updateQuantity, removeItem, totalAmount, isHydrated } = useCart()

  if (!isHydrated) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading cart…</Text>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="bag-handle-outline" size={44} color={colors.muted} />
        <Text style={styles.title}>Your cart is empty</Text>
        <Text style={styles.muted}>Discover fabrics crafted for every occasion.</Text>
        <Button title="Browse the collection" onPress={() => router.push('/')} style={{ marginTop: 20 }} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Cart</Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image_url }} style={styles.thumb} contentFit="cover" />
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text numberOfLines={1} style={styles.name}>
                  {item.name}
                </Text>
                <Text style={styles.lineTotal}>{formatNaira(item.price * item.quantity)}</Text>
              </View>
              <Text style={styles.unit}>{formatNaira(item.price)} each</Text>
              <View style={styles.controls}>
                <View style={styles.qtyRow}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </Pressable>
                </View>
                <Pressable onPress={() => removeItem(item.id)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={18} color={colors.faint} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryTotal}>{formatNaira(totalAmount)}</Text>
        </View>
        <Button title="Proceed to checkout" onPress={() => router.push('/checkout')} />
      </View>
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
  title: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 14 },
  muted: { color: colors.muted, marginTop: 6, textAlign: 'center' },
  list: { gap: 12, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  thumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.ink2 },
  info: { flex: 1, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  lineTotal: { color: colors.text, fontWeight: '700' },
  unit: { color: colors.pink, fontSize: 12, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  qtyBtn: { width: 34, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyText: { width: 24, textAlign: 'center', color: colors.text },
  summary: {
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: { color: colors.muted, fontSize: 15 },
  summaryTotal: { color: colors.pink, fontSize: 22, fontWeight: '700' },
})
