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
    threeDaysFromNow.setDate(now.getDate() + 3);

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

  private loadItems(): FoodItem[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      // Restore date objects
      return parsed.map((item: any) => ({
        ...item,
        expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
        addedDate: new Date(item.addedDate)
      }));
    } catch (e) {
      console.error('Failed to parse items', e);
      return [];
    }
  }

  private saveItems(items: FoodItem[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  addItem(item: Omit<FoodItem, 'id' | 'addedDate' | 'status'>) {
    const newItem: FoodItem = {
      ...item,
      id: crypto.randomUUID(),
      addedDate: new Date(),
      status: 'fresh'
    };

    this.itemsSignal.update(items => [...items, newItem]);
  }

  updateStatus(id: string, status: 'consumed' | 'expired') {
    this.itemsSignal.update(items =>
      items.map(item => item.id === id ? { ...item, status } : item)
    );
  }

  deleteItem(id: string) {
    this.itemsSignal.update(items => items.filter(item => item.id !== id));
  }
}
