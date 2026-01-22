export interface FoodItem {
  id: string;
  name: string;
  category: string;
  expirationDate: Date | null;
  location: 'fridge' | 'pantry';
  status: 'fresh' | 'consumed' | 'expired' | 'expiring';
  quantity: number;
  addedDate: Date;
  createdBy?: string; // Username of the person who added it
}
