import { Injectable, signal, computed, inject } from '@angular/core';
import { FoodItem } from '../models/food-item.model';
import { supabase } from './supabase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  // Using signals for reactive state
  private itemsSignal = signal<FoodItem[]>([]);

  readonly items = this.itemsSignal.asReadonly();

  readonly expiringSoon = computed(() => {
    // Return items that are status 'expiring'
    return this.itemsSignal().filter(item => item.status === 'expiring');
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
    // We can listen to auth changes directly from Supabase or inject AuthService.
    // Since this service is a singleton root service, it stays alive.
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.refreshItems();
      } else {
        this.itemsSignal.set([]); // Clear items if logged out
      }
    });
  }

  private determineStatus(date: Date): 'fresh' | 'expired' | 'expiring' {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const limitDate = new Date(todayUTC);
    limitDate.setUTCDate(todayUTC.getUTCDate() + 7);

    if (date < todayUTC) {
      return 'expired';
    } else if (date <= limitDate) {
      return 'expiring';
    } else {
      return 'fresh';
    }
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

        // Auto-update items status if needed (e.g. fresh -> expiring, or fresh -> expired)
        if ((status === 'fresh' || status === 'expiring') && expirationDate) {
          const newStatus = this.determineStatus(expirationDate);
          if (newStatus !== status) {
             status = newStatus;
          }
        }

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          expirationDate,
          location: item.location,
          status,
          quantity: item.quantity,
          addedDate: new Date(item.added_date),
          createdBy: item.created_by
        };
      });
      this.itemsSignal.set(items);
    }
  }

  authService = inject(AuthService);

  async addItem(item: Omit<FoodItem, 'id' | 'addedDate' | 'status'>) {
    let status: 'fresh' | 'expired' | 'expiring' = 'fresh';

    if (item.expirationDate) {
      status = this.determineStatus(item.expirationDate);
    }
    const username = this.authService.username();

    const { data, error } = await supabase
      .from('food_items')
      .insert({
        name: item.name,
        category: item.category,
        expiration_date: item.expirationDate?.toISOString().split('T')[0],
        location: item.location,
        status: status,
        quantity: item.quantity,
        created_by: username
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

  async updateStatus(id: string, status: 'consumed' | 'expired' | 'fresh' | 'expiring') {
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

    // Logic to determine status if date changes or if we are restoring an item
    if (updates.expirationDate !== undefined) {
       if (updates.expirationDate) {
           supabaseUpdates.status = this.determineStatus(new Date(updates.expirationDate));
       } else {
           supabaseUpdates.status = 'fresh';
       }
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

  async restoreItem(id: string) {
    // Get current item to find its expiration date
    const item = this.itemsSignal().find(i => i.id === id);
    if (!item) return;

    let newStatus: 'fresh' | 'expired' | 'expiring' = 'fresh';
    if (item.expirationDate) {
      newStatus = this.determineStatus(new Date(item.expirationDate));
    }

    await this.updateStatus(id, newStatus);
  }
}
