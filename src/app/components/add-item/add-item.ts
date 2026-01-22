import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FoodService } from '../../services/food.service';

@Component({
  selector: 'app-add-item',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-item.html',
  styleUrl: './add-item.css'
})
export class AddItemComponent {
  private fb = inject(FormBuilder);
  private foodService = inject(FoodService);
  private router = inject(Router);

  categories = ['Vegetales', 'Frutas', 'Lácteos', 'Carne', 'Bebidas', 'Salsas', 'Snacks', 'Granos', 'Otros'];
  locations = ['fridge', 'pantry'];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', Validators.required],
    location: ['fridge', Validators.required],
    expirationDate: [''],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  async onSubmit() {
    if (this.form.valid) {
      const val = this.form.value;
      await this.foodService.addItem({
        name: val.name!,
        category: val.category!,
        location: val.location as 'fridge' | 'pantry',
        expirationDate: val.expirationDate ? new Date(val.expirationDate) : null,
        quantity: val.quantity!
      });

      this.router.navigate(['/inventory']);
    }
  }
}
