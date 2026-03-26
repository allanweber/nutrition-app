export interface FavoriteItem {
  id: string; // favorites.id
  type: 'food' | 'dish';
  itemId: string; // foodId or dishId
  name: string;
  calories: number | null;
  thumbnail: string | null;
  createdAt: string;
}
