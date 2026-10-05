import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { api } from '@/lib/api'
import { formatNaira } from '@/lib/format'
import { colors, radius } from '@/lib/theme'

const CALLBACK_URL = 'https://favour-fabrics.vercel.app/order-confirmation'
const BANK = {
  bankName: process.env.EXPO_PUBLIC_BANK_NAME ?? 'Your Bank',
  accountName: process.env.EXPO_PUBLIC_ACCOUNT_NAME ?? 'Favour Fabrics',
  accountNumber: process.env.EXPO_PUBLIC_ACCOUNT_NUMBER ?? '0000000000',
}

type Method = 'paystack' | 'bank-transfer'

export default function CheckoutScreen() {
  const { items, totalAmount, clearCart } = useCart()
  const { user } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [method, setMethod] = useState<Method>('paystack')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default the email to the signed-in user's without an effect
  const emailValue = email || user?.email || ''

  const orderItems = () =>
    items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price }))
  const shipping = () => ({ fullName, address, city, state, phoneNumber: phone })

  const finish = () => {
    clearCart()
    router.replace('/order-confirmation') // fallback if no dedicated route
  }

  const handleSubmit = async () => {
    setError(null)
    if (!fullName || !emailValue || !phone || !address || !city || !state) {
      setError('Please fill in all shipping details.')
      return
    }
    setLoading(true)
    try {
      if (method === 'bank-transfer') {
        await api.post('/api/orders', {
          user_id: user?.id ?? null,
          customer_email: emailValue,
          items: orderItems(),
          total_amount: Math.round(totalAmount),
          payment_method: 'bank-transfer',
          payment_reference: null,
          shipping_address: shipping(),
          phone_number: phone,
        })
        finish()
        return
      }

      // Card: initialize on the backend, then open Paystack's hosted checkout
      const init = (await api.post('/api/paystack/initialize', {
        email: emailValue,
        amount: Math.round(totalAmount),
        callback_url: CALLBACK_URL,
        metadata: { customer_name: fullName, phone },
      })) as { authorization_url: string; reference: string }

      const result = await WebBrowser.openAuthSessionAsync(init.authorization_url, CALLBACK_URL)

      if (result.type === 'success') {
        await api.post('/api/orders/verify', {
          reference: init.reference,
          customer_email: emailValue,
          items: orderItems(),
          total_amount: Math.round(totalAmount),
          user_id: user?.id ?? null,
          shipping_address: shipping(),
          phone_number: phone,
        })
        finish()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.muted}>Your cart is empty.</Text>
        <Button title="Browse products" onPress={() => router.push('/')} style={{ marginTop: 16 }} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
        <Field
          label="Email"
          value={emailValue}
          onChangeText={setEmail}
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+234 800 000 0000"
          keyboardType="phone-pad"
        />
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="12 Favour St" />
        <View style={styles.twoCol}>
          <Field label="City" value={city} onChangeText={setCity} style={styles.col} />
          <Field label="State" value={state} onChangeText={setState} style={styles.col} />
        </View>

        <Text style={styles.section}>Payment</Text>
        <Pressable
          style={[styles.option, method === 'paystack' && styles.optionActive]}
          onPress={() => setMethod('paystack')}
        >
          <Ionicons
            name={method === 'paystack' ? 'radio-button-on' : 'radio-button-off'}
            size={18}
            color={colors.pink}
          />
          <Text style={styles.optionText}>Paystack — Card / Bank</Text>
        </Pressable>
        <Pressable
          style={[styles.option, method === 'bank-transfer' && styles.optionActive]}
          onPress={() => setMethod('bank-transfer')}
        >
          <Ionicons
            name={method === 'bank-transfer' ? 'radio-button-on' : 'radio-button-off'}
            size={18}
            color={colors.pink}
          />
          <Text style={styles.optionText}>Direct bank transfer</Text>
        </Pressable>

        {method === 'bank-transfer' && (
          <View style={styles.bank}>
            <Text style={styles.bankTitle}>Transfer to</Text>
            <Text style={styles.bankLine}>Bank: {BANK.bankName}</Text>
            <Text style={styles.bankLine}>Account name: {BANK.accountName}</Text>
            <Text style={styles.bankLine}>Account number: {BANK.accountNumber}</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
        </View>

        <Button
          title={method === 'paystack' ? `Pay ${formatNaira(totalAmount)}` : 'Place order'}
          onPress={handleSubmit}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({
  label,
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; style?: object }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.faint}
        autoCapitalize="words"
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  heading: { color: colors.text, fontSize: 20, fontWeight: '700' },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  muted: { color: colors.muted, marginTop: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: colors.text,
    paddingHorizontal: 14,
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  section: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 10, marginBottom: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionActive: { borderColor: colors.pink },
  optionText: { color: colors.text },
  bank: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    backgroundColor: 'rgba(236,72,153,0.08)',
    marginBottom: 10,
  },
  bankTitle: { color: colors.text, fontWeight: '600', marginBottom: 6 },
  bankLine: { color: colors.muted, fontSize: 13 },
  error: { color: colors.danger, marginBottom: 10 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  totalLabel: { color: colors.muted },
  totalValue: { color: colors.pink, fontSize: 22, fontWeight: '700' },
})
