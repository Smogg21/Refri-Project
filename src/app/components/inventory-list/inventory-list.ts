import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../services/food.service';
import { FoodItem } from '../../models/food-item.model';

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.css'
})
export class InventoryListComponent {
  foodService = inject(FoodService);

  filterCategory = signal('');
  filterLocation = signal('');

  categories = ['Vegetales', 'Frutas', 'Lácteos', 'Carne', 'Bebidas', 'Salsas', 'Snacks', 'Granos', 'Otros'];
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
    if(confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        this.foodService.deleteItem(id);
    }
  }

  markAsConsumed(id: string) {
    this.foodService.updateStatus(id, 'consumed');
  }
}
