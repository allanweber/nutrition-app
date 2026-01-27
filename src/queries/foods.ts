import { useQuery } from '@tanstack/react-query'

import type { SearchAggregatorResult } from '@/lib/nutrition-sources/types'

const FOOD_SEARCH_QUERY_KEY = (query: string) => ['foods', 'search', query]

export function useFoodSearchQuery(searchQuery: string) {
  return useQuery({
    queryKey: FOOD_SEARCH_QUERY_KEY(searchQuery),
    queryFn: async (): Promise<SearchAggregatorResult> => {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search foods')
      }
      const data = await response.json()
      return data.results
    },
    enabled: searchQuery.length >= 2,
  })
}

const BARCODE_QUERY_KEY = (upc: string) => ['foods', 'barcode', upc]

export function useBarcodeQuery(upc: string) {
  return useQuery({
    queryKey: BARCODE_QUERY_KEY(upc),
    queryFn: async (): Promise<SearchAggregatorResult> => {
      const response = await fetch(`/api/foods/upc?upc=${encodeURIComponent(upc)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup barcode')
      }

      return data.results
    },
    enabled: upc.length >= 6,
    retry: 0,
  })
}
