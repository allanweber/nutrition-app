export interface UnifiedFoodSearchResultItem {
  id: number | null;
  fatSecretId: string | null;
  name: string;
  brandName: string | null;
  foodType: 'Generic' | 'Brand' | 'Custom';
  thumbnail: string | null;
  calories: number | null;
}

export interface FoodSearchState {
  query: string;
  results: UnifiedFoodSearchResultItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isPending: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface FoodSearchFieldProps {
  state: FoodSearchState;
  onQueryChange: (query: string) => void;
  onLoadMore: () => void;
  onSelect: (item: UnifiedFoodSearchResultItem) => void;
  showCustomTab?: boolean;
  placeholder?: string;
  className?: string;
  size?: 'default' | 'small';
}

export interface FoodAddModalProps {
  open: boolean;
  food: UnifiedFoodSearchResultItem | null;
  foodDetail: import('@/queries/food-detail').FoodDetailResponse | null;
  isDetailLoading?: boolean;
  onClose: () => void;
  onAdded: () => void;
}
