import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'towers', pathMatch: 'full' },
  {
    path: 'towers',
    loadComponent: () => import('./features/tower/tower-list.component').then((m) => m.TowerListComponent),
  },
  {
    path: 'towers/new',
    loadComponent: () => import('./features/tower/tower-form.component').then((m) => m.TowerFormComponent),
  },
  {
    path: 'towers/:id',
    loadComponent: () => import('./features/foundation/foundation-design.component').then((m) => m.FoundationDesignComponent),
  },
  {
    path: '**',
    redirectTo: 'towers',
  },
];
