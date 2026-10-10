import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { useAuth } from './auth'

const CART_KEY = 'favour_fabrics_cart'

export type CartItem = {
  id: string
  name: string
  price: number
  image_url: string
  category?: string
  gender?: string
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  isHydrated: boolean
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  refresh: () => Promise<void>
  totalAmount: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

/* ---------------- guest cart (AsyncStorage) ---------------- */
async function readLocal(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}
async function writeLocal(items: CartItem[]) {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

/* ---------------- signed-in cart (Supabase, shared with web) ---------------- */
async function ensureCart(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('carts')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

async function fetchServerItems(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('carts')
    .select('id, cart_items(quantity, product:products(*))')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return []
  const rows = (data.cart_items ?? []) as unknown as {
    quantity: number
    product: CartItem | null
  }[]
  return rows
    .filter((r) => r.product)
    .map((r) => ({ ...(r.product as CartItem), quantity: r.quantity }))
}

function mergeById(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>()
  for (const item of [...a, ...b]) {
    const existing = map.get(item.id)
    if (existing) existing.quantity += item.quantity
    else map.set(item.id, { ...item })
  }
  return Array.from(map.values())
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [cartId, setCartId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false

    const load = async () => {
      setIsHydrated(false)

      if (user) {
        try {
          const local = await readLocal()
          const serverItems = await fetchServerItems(user.id)
          const id = await ensureCart(user.id)
          if (cancelled) return
          setCartId(id)

          let merged = serverItems
          if (local.length > 0) {
            merged = mergeById(serverItems, local)
            await Promise.all(
              merged.map((i) =>
                supabase
                  .from('cart_items')
                  .upsert(
                    { cart_id: id, product_id: i.id, quantity: i.quantity },
                    { onConflict: 'cart_id,product_id' }
                  )
              )
            )
            await writeLocal([])
          }
          setItems(merged)
        } catch (err) {
          console.error('[cart] server load failed, using local', err)
          if (!cancelled) setItems(await readLocal())
        }
      } else {
        setCartId(null)
        setItems(await readLocal())
      }

      if (!cancelled) setIsHydrated(true)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  /* ---- refresh from Supabase (picks up changes made on the web) ---- */
  const refresh = useCallback(async () => {
    if (authLoading) return
    if (user) {
      try {
        setItems(await fetchServerItems(user.id))
      } catch (err) {
        console.error('[cart] refresh failed', err)
      }
    } else {
      setItems(await readLocal())
    }
  }, [user, authLoading])

  // Refresh whenever the app returns to the foreground (e.g. after using the website).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh()
    })
    return () => sub.remove()
  }, [refresh])

  // Live updates: any cart_items change for this cart triggers a refetch.
  useEffect(() => {
    if (!user || !cartId) return
    const channel = supabase
      .channel(`cart-${cartId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` },
        () => {
          refresh()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, cartId, refresh])

  const persistLocal = (next: CartItem[]) => {
    if (!user) void writeLocal(next)
  }
  const serverUpsert = (productId: string, quantity: number) => {
    if (!user || !cartId) return
    supabase
      .from('cart_items')
      .upsert(
        { cart_id: cartId, product_id: productId, quantity },
        { onConflict: 'cart_id,product_id' }
      )
      .then(({ error }) => error && console.error('[cart] upsert', error))
  }
  const serverDelete = (productId: string) => {
    if (!user || !cartId) return
    supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .then(({ error }) => error && console.error('[cart] delete', error))
  }
  const serverClear = () => {
    if (!user || !cartId) return
    supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .then(({ error }) => error && console.error('[cart] clear', error))
  }

  const addItem: CartContextValue['addItem'] = (product, quantity = 1) => {
    const existing = items.find((i) => i.id === product.id)
    const nextQty = (existing?.quantity ?? 0) + quantity
    const next = existing
      ? items.map((i) => (i.id === product.id ? { ...i, quantity: nextQty } : i))
      : [...items, { ...product, quantity }]
    setItems(next)
    persistLocal(next)
    serverUpsert(product.id, nextQty)
  }

  const removeItem = (productId: string) => {
    const next = items.filter((i) => i.id !== productId)
    setItems(next)
    persistLocal(next)
    serverDelete(productId)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId)
    const next = items.map((i) => (i.id === productId ? { ...i, quantity } : i))
    setItems(next)
    persistLocal(next)
    serverUpsert(productId, quantity)
  }

  const clearCart = () => {
    setItems([])
    void writeLocal([])
    serverClear()
  }

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        isHydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refresh,
        totalAmount,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
