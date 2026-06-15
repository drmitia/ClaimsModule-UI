import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material.module';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClaimsService } from '../../core/services/claims.service';
import { ReferenceService } from '../../core/services/reference.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ClaimSummaryDto,
  ClaimStatus,
  PaginatedList,
} from '../../core/models/claim.models';
import { CauseOfLossCode } from '../../core/models/reference.models';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    StatusBadgeComponent,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './claims-list.component.html',
  styleUrl: './claims-list.component.scss',
})
export class ClaimsListComponent implements OnInit {
  private claimsService = inject(ClaimsService);
  private referenceService = inject(ReferenceService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // State
  loading = signal(false);
  result = signal<PaginatedList<ClaimSummaryDto> | null>(null);
  causeOfLossCodes = signal<CauseOfLossCode[]>([]);

  // Table columns
  displayedColumns = [
    'claimNumber',
    'policyNumber',
    'clientName',
    'lossDate',
    'causeOfLoss',
    'status',
    'totalReserve',
  ];

  // Status options for filter
  statusOptions: ClaimStatus[] = [
    'Draft',
    'Open',
    'UnderInvestigation',
    'PendingPayment',
    'Closed',
    'Reopened',
    'Withdrawn',
  ];

  pageSizeOptions = [10, 20, 50];

  // Filter form
  filterForm: FormGroup = this.fb.group({
    searchTerm: [''],
    status: [null],
    pageSize: [20],
    pageNumber: [1],
  });

  ngOnInit(): void {
    this.loadCauseOfLossCodes();
    this.loadClaims();

    // React to filter changes
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.filterForm.patchValue({ pageNumber: 1 }, { emitEvent: false });
        this.loadClaims();
      });
  }

  loadClaims(): void {
    this.loading.set(true);
    const { searchTerm, status, pageSize, pageNumber } =
      this.filterForm.value;

    this.claimsService
      .list({ searchTerm, status, pageSize, pageNumber })
      .subscribe({
        next: result => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to load claims', 'Close', {
            duration: 3000,
          });
          this.loading.set(false);
        },
      });
  }

  loadCauseOfLossCodes(): void {
    this.referenceService.getCauseOfLossCodes().subscribe({
      next: codes => this.causeOfLossCodes.set(codes),
    });
  }

  onRowClick(claim: ClaimSummaryDto): void {
    this.router.navigate(['/claims', claim.id]);
  }

  onNewClaim(): void {
    this.router.navigate(['/fnol']);
  }

  onPageChange(event: any): void {
    this.filterForm.patchValue({
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize,
    });
    this.loadClaims();
  }

  getTotalReserve(claim: ClaimSummaryDto): number {
    return claim.totalReserve ?? 0;
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      status: null,
      pageSize: 20,
      pageNumber: 1,
    });
  }
}