import { supabase } from './supabase'
import type { Product } from './types'

/**
 * Products live in Supabase (public read via RLS) — the same table the web app
 * reads. Going straight to Supabase keeps the mobile app working even when the
 * FastAPI backend is asleep.
 */
export async function listProducts(category?: string): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getProduct(id: string): Promise<Product> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data as Product
}
