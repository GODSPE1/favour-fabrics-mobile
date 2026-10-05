import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { colors } from '@/lib/theme'

export default function OrderConfirmationScreen() {
  return (
    <View style={styles.root}>
      <Ionicons name="checkmark-circle" size={64} color={colors.pink} />
      <Text style={styles.title}>Order confirmed</Text>
      <Text style={styles.muted}>
        Thank you for shopping with Favour Fabrics. Your cart is synced to your account.
      </Text>
      <Button title="View orders" onPress={() => router.replace('/orders')} style={styles.btn} />
      <Button
        title="Continue shopping"
        variant="outline"
        onPress={() => router.replace('/')}
        style={styles.btn}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 32,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 16 },
  muted: { color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  btn: { alignSelf: 'stretch', marginTop: 12 },
})
