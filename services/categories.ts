import { getUserId, supabase } from '@/lib/supabase'
import type { Category } from '@/types/app'

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function createCategory(name: string): Promise<Category> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
