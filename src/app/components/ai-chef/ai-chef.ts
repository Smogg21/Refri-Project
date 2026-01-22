import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../services/food.service';
import { AiService } from '../../services/ai.service';


@Component({
  selector: 'app-ai-chef',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chef.html',
  styleUrl: './ai-chef.css'
})
export class AiChefComponent {
  foodService = inject(FoodService);
  aiService = inject(AiService);

  mealType = signal<string>('Almuerzo');
  isLoading = signal<boolean>(false);
  suggestion = signal<string | null>(null);
  error = signal<string | null>(null);

  mealOptions = ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Postre'];

  async generateRecipes() {
    this.isLoading.set(true);
    this.error.set(null);
    this.suggestion.set(null);

    try {
      // Filter for items that are essentially available (fresh or expiring)
      const inventory = this.foodService.items().filter(item => item.status === 'fresh' || item.status === 'expiring');

      if (inventory.length === 0) {
        this.error.set('Tu inventario parece estar vacío o sin productos frescos. ¡Agrega algo antes de cocinar!');
        this.isLoading.set(false);
        return;
      }

      const result = await this.aiService.getRecipeSuggestions(inventory, this.mealType());
      this.suggestion.set(result);

    } catch (e: any) {
      this.error.set(e.message || 'Ocurrió un error al generar las recetas.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
