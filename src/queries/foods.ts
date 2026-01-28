import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import type { SearchAggregatorResult } from '@/lib/nutrition-sources/types'

const FOOD_SEARCH_QUERY_KEY = (query: string, page: number, pageSize: number) => [
  'foods',
  'search',
  query,
  page,
  pageSize,
]

export function useFoodSearchQuery(searchQuery: string, page = 0, pageSize = 25) {
  return useQuery({
    queryKey: FOOD_SEARCH_QUERY_KEY(searchQuery, page, pageSize),
    queryFn: async (): Promise<SearchAggregatorResult> => {
      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(searchQuery)}&page=${encodeURIComponent(
          String(page),
        )}&pageSize=${encodeURIComponent(String(pageSize))}`,
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search foods')
      }
      const data = await response.json()
      return data.results
    },
    enabled: searchQuery.trim().length >= 3,
  })
}

const INFINITE_FOOD_SEARCH_QUERY_KEY = (query: string, pageSize: number) => [
  'foods',
  'search',
  'infinite',
  query,
  pageSize,
]

export function useInfiniteFoodSearchQuery(searchQuery: string, pageSize = 25) {
  return useInfiniteQuery({
    queryKey: INFINITE_FOOD_SEARCH_QUERY_KEY(searchQuery, pageSize),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<SearchAggregatorResult> => {
      const page = typeof pageParam === 'number' ? pageParam : Number(pageParam)

      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(searchQuery)}&page=${encodeURIComponent(
          String(page),
        )}&pageSize=${encodeURIComponent(String(pageSize))}`,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search foods')
      }

      return data.results
    },
    enabled: searchQuery.trim().length >= 3,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page ?? 0
      return lastPage.hasMore ? currentPage + 1 : undefined
    },
  })
}

export const FOOD_IMAGE_QUERY_KEY = (foodUrl: string) => ['foods', 'image', foodUrl]

export async function fetchFoodImageUrl(foodUrl: string): Promise<string | null> {
  const response = await fetch(`/api/foods/image?food_url=${encodeURIComponent(foodUrl)}`)

  if (response.status === 404) {
    return null
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMessage =
      typeof data?.error === 'string' && data.error.trim().length > 0
        ? data.error
        : 'Failed to fetch food image'
    throw new Error(errorMessage)
  }

  const imageUrl = typeof data?.imageUrl === 'string' ? data.imageUrl : null
  return imageUrl
}
