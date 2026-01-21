export interface FoodItem {
  id: string;
  name: string;
  category: string;
  expirationDate: Date | null;
  location: 'fridge' | 'pantry';
  status: 'fresh' | 'consumed' | 'expired';
  quantity: number;
  addedDate: Date;
}
