const store = typeof localStorage !== 'undefined' ? localStorage : null

export const storage = {
  getItem: (key: string) => Promise.resolve(store?.getItem(key) ?? null),
  setItem: (key: string, value: string) => {
    store?.setItem(key, value)
    return Promise.resolve()
  },
  removeItem: (key: string) => {
    store?.removeItem(key)
    return Promise.resolve()
  },
}
