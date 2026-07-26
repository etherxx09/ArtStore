import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Use local API server if no Supabase URL configured
const isLocalMode = !url || url === 'http://localhost:3000' || url === 'your-project.supabase.co'

export const isSupabaseConfigured = !isLocalMode

// Local API base
const LOCAL_API = 'http://localhost:3000/rest/v1'

// Create a local mock client that mimics Supabase interface
function createLocalClient(): SupabaseClient {
  return {
    from: (table: string) => {
      return {
        select: (columns: string = '*') => ({
          eq: (field: string, value: any) => ({
            order: (orderField: string, options?: { ascending?: boolean }) => ({
              then: (callback: (data: any) => void) => {
                let url = `${LOCAL_API}/${table}`;
                const params = new URLSearchParams();

                if (field && value !== undefined) {
                  params.append(`${field}=eq.${value}`, '');
                }
                if (orderField) {
                  const direction = options?.ascending === false ? '.desc' : '.asc';
                  params.append('order', `${orderField}${direction}`);
                }

                const queryString = params.toString();
                if (queryString) {
                  url += '?' + queryString;
                }

                fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': 'local-dev',
                    'Authorization': 'Bearer local-dev',
                  },
                })
                  .then(res => res.json())
                  .then(result => {
                    callback({ data: result.data || [], error: null });
                  })
                  .catch(err => {
                    callback({ data: null, error: err });
                  });
              }
            }),
            single: () => ({
              then: (callback: (data: any) => void) => {
                const url = `${LOCAL_API}/${table}?${field}=eq.${value}`;

                fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': 'local-dev',
                    'Authorization': 'Bearer local-dev',
                  },
                })
                  .then(res => res.json())
                  .then(result => {
                    callback({ data: result.data?.[0] || null, error: null });
                  })
                  .catch(err => {
                    callback({ data: null, error: err });
                  });
              }
            })
          }),
          order: (orderField: string, options?: { ascending?: boolean }) => ({
            range: (from: number, to: number) => ({
              then: (callback: (data: any) => void) => {
                const direction = options?.ascending === false ? '.desc' : '.asc';
                const url = `${LOCAL_API}/${table}?is_published=eq.true&order=${orderField}${direction}`;

                fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': 'local-dev',
                    'Authorization': 'Bearer local-dev',
                  },
                })
                  .then(res => res.json())
                  .then(result => {
                    callback({ data: result.data || [], error: null });
                  })
                  .catch(err => {
                    callback({ data: null, error: err });
                  });
              }
            })
          })
        }),
        eq: (field: string, value: any) => ({
          order: (orderField: string) => ({
            then: (callback: (data: any) => void) => {
              const url = `${LOCAL_API}/${table}?${field}=eq.${value}&order=${orderField}`;

              fetch(url, {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'apikey': 'local-dev',
                  'Authorization': 'Bearer local-dev',
                },
              })
                .then(res => res.json())
                .then(result => {
                  callback({ data: result.data || [], error: null });
                })
                .catch(err => {
                  callback({ data: null, error: err });
                });
            }
          })
        })
      };
    }
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, publishableKey!)
  : createLocalClient()
