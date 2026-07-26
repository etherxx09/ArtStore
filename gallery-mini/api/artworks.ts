const API_BASE = 'http://192.168.3.122:3000/rest/v1'
const IMAGE_BASE = 'http://192.168.3.122:3000'

export type InventoryStatus = 'available' | 'reserved' | 'sold'

export type Artwork = {
  id: string
  inventory_number: string
  title: string
  title_zh: string | null
  origin: string
  material: string
  technique: string | null
  dimensions: string
  price: string
  inventory_status: InventoryStatus
  image_url: string | null
  region: string
  sort_order: number
}

// Known broken images that don't exist on server
const BROKEN_IMAGES = ['2026050404.jpeg', '2026050411.jpeg']

function processArtwork(art: any): Artwork {
  let imageUrl = art.image_url || null

  if (imageUrl && imageUrl.startsWith('/images/')) {
    const filename = imageUrl.replace('/images/', '')
    // Check if this is a broken image
    if (BROKEN_IMAGES.includes(filename)) {
      imageUrl = null
    } else {
      imageUrl = IMAGE_BASE + imageUrl
    }
  }

  return {
    ...art,
    image_url: imageUrl
  }
}

export async function fetchArtworks(): Promise<Artwork[]> {
  const url = `${API_BASE}/artworks?is_published=eq.true`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })
  const data = await res.json()
  const artworks = data.data || []
  return artworks.map(processArtwork)
}

export async function fetchArtworkById(id: string): Promise<Artwork | null> {
  const url = `${API_BASE}/artworks?id=eq.${id}&is_published=eq.true`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })
  const data = await res.json()
  const items = data.data || []
  return items.length > 0 ? processArtwork(items[0]) : null
}
