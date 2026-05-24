import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/obras', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },

  // Protected shell — all authenticated pages live here
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      // Obras
      {
        path: 'obras',
        loadComponent: () =>
          import('./features/obra/obra-list.component').then((m) => m.ObraListComponent),
      },
      {
        path: 'obras/nova',
        loadComponent: () =>
          import('./features/obra/obra-form.component').then((m) => m.ObraFormComponent),
      },
      {
        path: 'obras/:id',
        loadComponent: () =>
          import('./features/obra/obra-shell.component').then((m) => m.ObraShellComponent),
        children: [
          { path: '', redirectTo: 'torres', pathMatch: 'full' },
          {
            path: 'torres',
            loadComponent: () =>
              import('./features/obra/obra-torres.component').then((m) => m.ObraTorresComponent),
          },
          {
            path: 'torres/nova',
            loadComponent: () =>
              import('./features/tower/tower-form.component').then((m) => m.TowerFormComponent),
          },
          {
            path: 'documentos',
            loadComponent: () =>
              import('./features/obra/obra-documentos.component').then((m) => m.ObraDocumentosComponent),
          },
          {
            path: 'validacao',
            loadComponent: () =>
              import('./features/obra/obra-validacao.component').then((m) => m.ObraValidacaoComponent),
          },
        ],
      },

      // Catálogo global
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./features/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
      },

      // Cálculo de torres (rotas nomeadas por classificação)
      {
        path: 'torres/:id/autoportante',
        loadComponent: () =>
          import('./features/foundation/foundation-design.component').then(
            (m) => m.FoundationDesignComponent,
          ),
      },
      {
        path: 'torres/:id/estaiada',
        loadComponent: () =>
          import('./features/foundation/foundation-design.component').then(
            (m) => m.FoundationDesignComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: '/obras' },
];
