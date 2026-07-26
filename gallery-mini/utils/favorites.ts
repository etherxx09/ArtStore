const FAVORITES_KEY = 'gallery_favorites'

export function getFavorites(): string[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addFavorite(id: string): void {
  const favorites = getFavorites()
  if (!favorites.includes(id)) {
    favorites.push(id)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }
}

export function removeFavorite(id: string): void {
  const favorites = getFavorites()
  const filtered = favorites.filter(f => f !== id)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered))
}

export function toggleFavorite(id: string): boolean {
  const favorites = getFavorites()
  const isFavorited = favorites.includes(id)
  if (isFavorited) {
    removeFavorite(id)
  } else {
    addFavorite(id)
  }
  return !isFavorited
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id)
}
