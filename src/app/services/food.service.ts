import { Injectable, signal, computed } from '@angular/core';
import { FoodItem } from '../models/food-item.model';
import { supabase } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  // Using signals for reactive state
  private itemsSignal = signal<FoodItem[]>([]);

  readonly items = this.itemsSignal.asReadonly();

  readonly expiringSoon = computed(() => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const limitDate = new Date(todayUTC);
    limitDate.setUTCDate(todayUTC.getUTCDate() + 7);

    return this.itemsSignal().filter(item => {
      if (!item.expirationDate || item.status !== 'fresh') return false;
      const itemDate = new Date(item.expirationDate);
      return itemDate >= todayUTC && itemDate <= limitDate;
    });
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
    this.refreshItems();
  }

  private checkExpiration(date: Date): boolean {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    return date < todayUTC;
  }

  async refreshItems() {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .order('added_date', { ascending: false });

    if (error) {
      console.error('Error fetching items from Supabase:', error);
      return;
    }

    if (data) {
      const items: FoodItem[] = data.map((item: any) => {
        const expirationDate = item.expiration_date ? new Date(item.expiration_date) : null;
        let status = item.status;

        // Auto-expire items if needed
        if (status === 'fresh' && expirationDate && this.checkExpiration(expirationDate)) {
          status = 'expired';
          // We could update the status in the DB here too, but for now we just show it
        }

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          expirationDate,
          location: item.location,
          status,
          quantity: item.quantity,
          addedDate: new Date(item.added_date)
        };
      });
      this.itemsSignal.set(items);
    }
  }

  async addItem(item: Omit<FoodItem, 'id' | 'addedDate' | 'status'>) {
    const isExpired = item.expirationDate && this.checkExpiration(item.expirationDate);
    const status = isExpired ? 'expired' : 'fresh';

    const { data, error } = await supabase
      .from('food_items')
      .insert({
        name: item.name,
        category: item.category,
        expiration_date: item.expirationDate?.toISOString().split('T')[0],
        location: item.location,
        status: status,
        quantity: item.quantity
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item to Supabase:', error);
      return;
    }

    if (data) {
      await this.refreshItems();
    }
  }

  async updateStatus(id: string, status: 'consumed' | 'expired') {
    const { error } = await supabase
      .from('food_items')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status in Supabase:', error);
      return;
    }

    await this.refreshItems();
  }

  async updateItem(id: string, updates: Partial<FoodItem>) {
    const supabaseUpdates: any = {};
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.category) supabaseUpdates.category = updates.category;
    if (updates.expirationDate !== undefined) {
      supabaseUpdates.expiration_date = updates.expirationDate?.toISOString().split('T')[0] || null;
    }
    if (updates.location) supabaseUpdates.location = updates.location;
    if (updates.status) supabaseUpdates.status = updates.status;
    if (updates.quantity !== undefined) supabaseUpdates.quantity = updates.quantity;

    // If expiration date changed, re-check status if not explicitly provided
    if (updates.expirationDate !== undefined && !updates.status) {
       const isExpired = updates.expirationDate && this.checkExpiration(new Date(updates.expirationDate));
       supabaseUpdates.status = isExpired ? 'expired' : 'fresh';
    }

    const { error } = await supabase
      .from('food_items')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating item in Supabase:', error);
      return;
    }

    await this.refreshItems();
  }

  async deleteItem(id: string) {
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item from Supabase:', error);
      return;
    }

    await this.refreshItems();
  }
}
