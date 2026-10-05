export type Product = {
  id: string
  name: string
  description?: string | null
  price: number // kobo
  image_url: string
  category: 'male' | 'female' | 'kids' | string
  gender: string
  stock?: number
  is_active?: boolean
}

export type Order = {
  id: string
  customer_email: string
  items: { id: string; name: string; quantity: number; price: number }[]
  total_amount: number
  payment_method: 'paystack' | 'bank-transfer' | string
  payment_status: string
  order_status: string
  created_at: string
}
