import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClaimsListRoutingModule } from './claims-list-routing.module';
import { ClaimsListComponent } from './claims-list.component';
import { MaterialModule } from '../../shared/material/material.module';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@NgModule({  
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClaimsListRoutingModule,
    MaterialModule,
    StatusBadgeComponent,
    ClaimsListComponent,
  ],
})
export class ClaimsListModule {}