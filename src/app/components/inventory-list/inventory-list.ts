import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FoodService } from '../../services/food.service';
import { FoodItem } from '../../models/food-item.model';

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.css'
})
export class InventoryListComponent {
  foodService = inject(FoodService);
  private fb = inject(FormBuilder);

  filterCategory = signal('');
  filterLocation = signal('');

  editingItem = signal<FoodItem | null>(null);

  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', Validators.required],
    location: ['fridge', Validators.required],
    expirationDate: [''],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

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

  startEdit(item: FoodItem) {
    this.editingItem.set(item);
    this.editForm.patchValue({
      name: item.name,
      category: item.category,
      location: item.location,
      expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '',
      quantity: item.quantity
    });
  }

  cancelEdit() {
    this.editingItem.set(null);
    this.editForm.reset();
  }

  saveEdit() {
    const item = this.editingItem();
    if (item && this.editForm.valid) {
      const val = this.editForm.value;
      this.foodService.updateItem(item.id, {
        name: val.name!,
        category: val.category!,
        location: val.location as 'fridge' | 'pantry',
        expirationDate: val.expirationDate ? new Date(val.expirationDate) : null,
        quantity: val.quantity!
      });
      this.cancelEdit();
    }
  }

  deleteItem(id: string) {
    if(confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        this.foodService.deleteItem(id);
    }
  }

  markAsConsumed(id: string) {
    this.foodService.updateStatus(id, 'consumed');
  }
}
