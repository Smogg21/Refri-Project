import { Injectable } from '@angular/core';
import { FoodItem } from '../models/food-item.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private model = 'google/gemini-2.5-flash-lite';

  async getRecipeSuggestions(inventory: FoodItem[], mealType: string, additionalDetails?: string): Promise<string> {
    const apiKey = environment.openRouterApiKey;

    if (!apiKey || apiKey === 'YOUR_OPENROUTER_KEY_HERE') {
      throw new Error('API Key no configurada en environments.');
    }

    const inventoryList = inventory
      .map(item => {
        // Now we trust the status provided by FoodService (which includes 'expiring')
        const statusLabel = `[${item.status}]`;
        return `- ${item.name} (${item.quantity}) ${statusLabel}`;
      })
      .join('\n');

    const prompt = `
      Actúa como un chef experto. Tengo los siguientes ingredientes en mi cocina:
      ${inventoryList}

      Por favor, sugiereme 2 opciones de recetas que pueda preparar para: ${mealType}.
      ${additionalDetails ? `Ten en cuenta estos detalles adicionales del usuario: ${additionalDetails}` : ''}
      Utiliza los ingredientes que tienes disponibles, pero prioriza utilizar los ingredientes marcados como '[expiring]', ya que están próximos a caducar, aunque no es obligatorio usarlos.
      Si me falta algún ingrediente común (como sal, aceite, especias), asume que lo tengo, pero menciónalo si es algo específico. No asumas que tengo ingredientes más complejos.
      Si ves muy complicado generar alguna receta con los pocos ingredientes que tenemos, puedes mencionarlo. No tienes que obligatoriamente entregar 2 recetas si lo ves muy complicado.
      Por úlitmo, al final de tus sugerencias puedes dar sugerencia de algún insumo que sería buena idea comprar para poder tener más recetas con lo que tenemos actualmente.

      El formato debe ser:
      ## [Nombre de la receta]
      **Ingredientes necesarios:** (lista)
      **Instrucciones:** (pasos breves)
      **Por qué esta receta:** (breve explicación basada en mi inventario)

      Responde en español y sé creativo pero realista.
    `;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin, // Required by OpenRouter for some tiers
          'X-Title': 'Refri-Project'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al comunicarse con la IA');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No se pudieron generar recetas.';

    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }
}
