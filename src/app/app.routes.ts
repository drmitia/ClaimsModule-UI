import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'claims',
    pathMatch: 'full',
  },
  {
    path: 'claims',
    loadChildren: () =>
      import('./features/claims-list/claims-list.module').then(
        m => m.ClaimsListModule
      ),
  },
  {
    path: 'claims/:id',
    loadChildren: () =>
      import('./features/claim-detail/claim-detail.module').then(
        m => m.ClaimDetailModule
      ),
  },
  {
    path: 'fnol',
    loadChildren: () =>
      import('./features/fnol/fnol.module').then(
        m => m.FnolModule
      ),
  },
];