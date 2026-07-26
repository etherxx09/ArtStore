// Local API Client - mimics Supabase client structure
// This replaces Supabase for local development

const API_BASE = 'http://localhost:3000/rest/v1';

export type InventoryStatus = 'available' | 'reserved' | 'sold';

export type ArtworkRecord = {
  id: string;
  inventory_number: string;
  title: string;
  title_zh: string | null;
  origin: string | null;
  material: string;
  technique: string | null;
  dimensions: string;
  price: string;
  inventory_status: InventoryStatus;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
};

// Fetch artworks from local API
export async function fetchArtworks(): Promise<ArtworkRecord[]> {
  const response = await fetch(`${API_BASE}/artworks?is_published=eq.true&order=sort_order.asc`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch artworks: ${response.status}`);
  }

  const result = await response.json();
  return result.data || [];
}

// Fetch single artwork
export async function fetchArtwork(inventoryNumber: string): Promise<ArtworkRecord | null> {
  const response = await fetch(`${API_BASE}/artworks?inventory_number=eq.${inventoryNumber}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return result.data?.[0] || null;
}

// Create client instance (mimics Supabase client)
export const localClient = {
  from: (table: string) => {
    if (table === 'artworks') {
      return {
        select: (columns: string = '*') => ({
          eq: (field: string, value: any) => ({
            order: (orderField: string) => ({
              then: (callback: (data: ArtworkRecord[]) => void) => {
                // Build query
                let url = `${API_BASE}/artworks`;
                const params = new URLSearchParams();

                if (field && value !== undefined) {
                  params.append(`${field}=eq.${value}`, '');
                }
                if (orderField) {
                  params.append('order', orderField);
                }

                if (params.toString()) {
                  url += '?' + params.toString();
                }

                fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                })
                  .then(res => res.json())
                  .then(result => callback(result.data || []))
                  .catch(err => console.error('Query error:', err));
              }
            }),
            single: () => ({
              then: (callback: (data: ArtworkRecord | null) => void) => {
                const url = `${API_BASE}/artworks?${field}=eq.${value}`;

                fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                })
                  .then(res => res.json())
                  .then(result => callback(result.data?.[0] || null))
                  .catch(err => callback(null));
              }
            })
          }),
          order: (field: string, { ascending = true }: { ascending?: boolean } = {}) => ({
            range: (from: number, to: number) => ({
              then: (callback: (data: ArtworkRecord[]) => void) => {
                const url = `${API_BASE}/artworks?is_published=eq.true&order=${field}.${ascending ? 'asc' : 'desc'}`;

                fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                })
                  .then(res => res.json())
                  .then(result => callback(result.data || []))
                  .catch(err => console.error('Query error:', err));
              }
            })
          })
        }),
        eq: (field: string, value: any) => ({
          single: () => ({
            then: (callback: (data: ArtworkRecord | null) => void) => {
              const url = `${API_BASE}/artworks?${field}=eq.${value}`;

              fetch(url, {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
              })
                .then(res => res.json())
                .then(result => callback(result.data?.[0] || null))
                .catch(err => callback(null));
            }
          })
        })
      };
    }
  }
};

export default localClient;