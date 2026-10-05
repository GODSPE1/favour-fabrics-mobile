import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { colors, radius } from '@/lib/theme'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

type Props = {
  title: string
  onPress?: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  compact?: boolean
}

const BG: Record<Variant, string> = {
  primary: colors.pink,
  secondary: colors.white,
  outline: 'transparent',
  ghost: 'transparent',
  danger: colors.danger,
}
const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.ink,
  outline: colors.text,
  ghost: colors.rose,
  danger: colors.white,
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  compact,
}: Props) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        {
          backgroundColor: BG[variant],
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.borderStrong,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} size="small" />
      ) : (
        <Text style={[styles.text, { color: FG[variant] }]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  compact: { height: 36, paddingHorizontal: 14 },
  text: { fontSize: 15, fontWeight: '600' },
})
