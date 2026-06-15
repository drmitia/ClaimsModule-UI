import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FnolComponent } from './fnol.component';

const routes: Routes = [
  { path: '', component: FnolComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FnolRoutingModule {}