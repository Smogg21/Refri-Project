import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../services/food.service';
import { FoodItem } from '../../models/food-item.model';

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule, FormsModule, DatePipe, TitleCasePipe],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.css'
})
export class InventoryListComponent {
  foodService = inject(FoodService);

  filterCategory = signal('');
  filterLocation = signal('');

  categories = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Beverages', 'Sauces', 'Snacks', 'Grains', 'Other'];
  locations = ['fridge', 'pantry'];

  filteredItems = computed(() => {
    let items = this.foodService.items();
    const cat = this.filterCategory();
    const loc = this.filterLocation();

    if (cat) {
      items = items.filter(i => i.category === cat);
    }
    if (loc) {
      items = items.filter(i => i.location === loc);
    }

    // Sort by expiration date (nearest first), nulls last
    return items.sort((a, b) => {
      if (!a.expirationDate) return 1;
      if (!b.expirationDate) return -1;
      return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
    });
  });

  deleteItem(id: string) {
    if(confirm('Are you sure used want to delete this item?')) {
        this.foodService.deleteItem(id);
    }
  }

  markAsConsumed(id: string) {
    this.foodService.updateStatus(id, 'consumed');
  }
}
