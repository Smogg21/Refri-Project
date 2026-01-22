import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { InventoryListComponent } from './components/inventory-list/inventory-list';
import { AddItemComponent } from './components/add-item/add-item';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'inventory', component: InventoryListComponent },
      { path: 'add', component: AddItemComponent },
      { path: 'chef', loadComponent: () => import('./components/ai-chef/ai-chef').then(m => m.AiChefComponent) }
    ]
  }
];
