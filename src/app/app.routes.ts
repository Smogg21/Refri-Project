import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { InventoryListComponent } from './components/inventory-list/inventory-list';
import { AddItemComponent } from './components/add-item/add-item';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'inventory', component: InventoryListComponent },
  { path: 'add', component: AddItemComponent }
];
