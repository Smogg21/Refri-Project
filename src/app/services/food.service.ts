import { Injectable, signal, computed, effect } from '@angular/core';
import { FoodItem } from '../models/food-item.model';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private readonly STORAGE_KEY = 'refri_items';

  // Using signals for reactive state
  private itemsSignal = signal<FoodItem[]>(this.loadItems());

  readonly items = this.itemsSignal.asReadonly();

  readonly expiringSoon = computed(() => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 7);

    return this.itemsSignal().filter(item =>
      item.expirationDate &&
      new Date(item.expirationDate) <= threeDaysFromNow &&
      new Date(item.expirationDate) >= now &&
      item.status === 'fresh'
    );
  });

  readonly stats = computed(() => {
    const currentItems = this.itemsSignal();
    return {
      total: currentItems.length,
      fridge: currentItems.filter(i => i.location === 'fridge' && i.status === 'fresh').length,
      pantry: currentItems.filter(i => i.location === 'pantry' && i.status === 'fresh').length,
      expired: currentItems.filter(i => i.status === 'expired').length
    };
  });

  constructor() {
    effect(() => {
      this.saveItems(this.itemsSignal());
    });
  }

  private checkExpiration(date: Date): boolean {
    const now = new Date();
    // Create UTC midnight date for comparison to match input format logic
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    return date < todayUTC;
  }

  private loadItems(): FoodItem[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      // Restore date objects and check expiration
      return parsed.map((item: any) => {
        const expirationDate = item.expirationDate ? new Date(item.expirationDate) : null;
        let status = item.status;

        // Auto-expire items if needed
        if (status === 'fresh' && expirationDate && this.checkExpiration(expirationDate)) {
          status = 'expired';
        }

        return {
          ...item,
          expirationDate,
          addedDate: new Date(item.addedDate),
          status
        };
      });
    } catch (e) {
      console.error('Failed to parse items', e);
      return [];
    }
  }

  private saveItems(items: FoodItem[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  addItem(item: Omit<FoodItem, 'id' | 'addedDate' | 'status'>) {
    const isExpired = item.expirationDate && this.checkExpiration(item.expirationDate);

    const newItem: FoodItem = {
      ...item,
      id: crypto.randomUUID(),
      addedDate: new Date(),
      status: isExpired ? 'expired' : 'fresh'
    };

    this.itemsSignal.update(items => [...items, newItem]);
  }

  updateStatus(id: string, status: 'consumed' | 'expired') {
    this.itemsSignal.update(items =>
      items.map(item => item.id === id ? { ...item, status } : item)
    );
  }

  updateItem(id: string, updates: Partial<FoodItem>) {
    this.itemsSignal.update(items =>
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          // Re-check status if expiration date changed
          if (updates.expirationDate || updates.status === undefined) {
             const isExpired = updatedItem.expirationDate && this.checkExpiration(new Date(updatedItem.expirationDate));
             updatedItem.status = isExpired ? 'expired' : (updatedItem.status === 'expired' ? 'fresh' : updatedItem.status);
          }
          return updatedItem;
        }
        return item;
      })
    );
  }

  deleteItem(id: string) {
    this.itemsSignal.update(items => items.filter(item => item.id !== id));
  }
}
