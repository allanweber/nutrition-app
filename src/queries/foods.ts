import { useQuery } from '@tanstack/react-query'

interface FoodSearchResult {
  common?: Array<{
    food_name: string
    brand_name?: string
    serving_unit: string
    serving_qty: number
    photo?: { thumb: string }
    tag_id?: number
    nix_item_id?: string
  }>
  branded?: Array<{
    food_name: string
    brand_name?: string
    serving_unit: string
    serving_qty: number
    photo?: { thumb: string }
    tag_id?: number
    nix_item_id?: string
  }>
}

const FOOD_SEARCH_QUERY_KEY = (query: string) => ['foods', 'search', query]

export function useFoodSearchQuery(searchQuery: string) {
  return useQuery({
    queryKey: FOOD_SEARCH_QUERY_KEY(searchQuery),
    queryFn: async (): Promise<FoodSearchResult> => {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search foods')
      }
      const data = await response.json()
      return data.results || {}
    },
    enabled: searchQuery.length >= 2,
  })
}