import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material.module';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { StatusLabelPipe } from '../../shared/components/status-label.pipe';
import { ClaimsService } from '../../core/services/claims.service';
import { ReservesService } from '../../core/services/reserves.service';
import { DocumentsService } from '../../core/services/documents.service';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { RejectReserveDialogComponent } from '../../shared/components/reject-reserve-dialog.component';
import { JustificationDialogComponent } from '../../shared/components/justification-dialog.component';
import {
  ClaimDetailDto,
  ClaimStatus,
  AuditLogDto,
  ReserveHistoryDto,
} from '../../core/models/claim.models';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    StatusBadgeComponent,
    StatusLabelPipe,
  ],
  templateUrl: './claim-detail.component.html',
  styleUrl: './claim-detail.component.scss',
})
export class ClaimDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private claimsService = inject(ClaimsService);
  private reservesService = inject(ReservesService);
  private documentsService = inject(DocumentsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  // State
  loading = signal(false);
  claim = signal<ClaimDetailDto | null>(null);
  auditLogs = signal<AuditLogDto[]>([]);
  claimId = '';

  showPartyForm = signal(false);
  showRiskObjectForm = signal(false);

  // Reserve form
  showReservePanel = signal(false);
  reserveForm = this.fb.group({
    component: ['Indemnity'],
    amount: [null],
    changeReason: [''],
  });

  partyForm = this.fb.group({
    partyRole: ['Claimant'],
    partyType: ['Person'],
    firstName: [''],
    lastName: [''],
    companyName: [''],
    email: [''],
    phone: [''],
  });

  riskObjectForm = this.fb.group({
    assetType: ['Vehicle'],
    assetDescription: [''],
    damageDescription: [''],
    isPrimary: [false],
    assetReference: [''],
  });

  partyRoles = ['Claimant', 'Insured', 'ThirdParty', 'Witness', 'Attorney'];
  assetTypes = ['Vehicle', 'Property', 'Person', 'Equipment', 'Other'];

  // Status transitions
  validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
    Draft: ['Open', 'Withdrawn'],
    Open: ['UnderInvestigation', 'PendingPayment', 'Closed', 'Withdrawn'],
    UnderInvestigation: ['Open', 'PendingPayment', 'Closed'],
    PendingPayment: ['Closed', 'UnderInvestigation'],
    Closed: ['Reopened'],
    Reopened: ['Open', 'Closed', 'Withdrawn'],
    Withdrawn: [],
  };

  reserveComponents = ['Indemnity', 'Expense', 'ALAE', 'SubrogationRecoverable'];
  documentTypes = ['PoliceReport', 'MedicalReport', 'Invoice', 'Photo', 'Other'];

  // Audit log columns
  auditColumns = ['createdAt', 'eventType', 'description', 'user'];

  // Reserve history columns
  reserveColumns = [
    'createdAt', 'type', 'component', 'amount',
    'status', 'submittedBy', 'actions'
  ];

  ngOnInit(): void {
    this.claimId = this.route.snapshot.paramMap.get('id')!;
    this.loadClaim();
    this.loadAuditLog();
  }

  loadClaim(): void {
    this.loading.set(true);
    this.claimsService.getById(this.claimId).subscribe({
      next: claim => {
        this.claim.set(claim);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load claim', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  loadAuditLog(): void {
    this.claimsService.getAuditLog(this.claimId).subscribe({
      next: logs => this.auditLogs.set(logs),
    });
  }

  getValidTransitions(): ClaimStatus[] {
    const status = this.claim()?.status;
    if (!status) return [];
    return this.validTransitions[status] ?? [];
  }

  onTransition(newStatus: ClaimStatus): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Status Transition',
        message: `Are you sure you want to change the status to "${newStatus}"?`,
        confirmLabel: 'Confirm',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.executeTransition(newStatus, false, null);
    });
  }

  private executeTransition(
    newStatus: ClaimStatus,
    confirmCloseWithOpenReserves: boolean,
    justification: string | null
  ): void {
    const payload = {
      newStatus,
      reason: justification,
      confirmCloseWithOpenReserves,
      openReservesJustification: justification,
    };

    console.log('Sending transition payload:', payload);

    this.claimsService.transition(this.claimId, payload).subscribe({
      next: result => {
        console.log('Transition result:', result); // ← add this
  console.log('succeeded:', result.succeeded);
  console.log('blockingIssues:', result.blockingIssues);
  console.log('warnings:', result.warnings);
        if (result.succeeded) {
          this.snackBar.open(
            `Status changed to ${newStatus}`,
            'Close',
            { duration: 3000 }
          );
          this.loadClaim();
          this.loadAuditLog();
          return;
        }

        // Blocking issues — cannot proceed
        if (result.blockingIssues.length > 0) {
          this.snackBar.open(
            result.blockingIssues.join(' | '),
            'Close',
            { duration: 6000 }
          );
          return;
        }

        // CC-04 warning — open reserves, ask for justification
        if (result.warnings.length > 0 && newStatus === 'Closed') {
          const warningDialog = this.dialog.open(ConfirmDialogComponent, {
            width: '500px',
            data: {
              title: 'Open Reserves Warning',
              message: 'This claim has reserve components with a balance greater than zero.',
              warning: 'Are you sure you want to close it anyway?',
              confirmLabel: 'Yes, proceed',
            },
          });

          warningDialog.afterClosed().subscribe(confirmed => {
            console.log('Warning dialog closed with:', confirmed); // ← add
            if (!confirmed) return;

            const justificationDialog = this.dialog.open(
              JustificationDialogComponent,
              { width: '500px' }
            );

            justificationDialog.afterClosed().subscribe(justification => {
              console.log('Justification dialog closed with:', justification); // ← add
              if (!justification) return;
              console.log('Calling executeTransition with confirm=true'); // ← add
              this.executeTransition(newStatus, true, justification);
            });
          });
        }
      },
      error: err => {
        this.snackBar.open(
          err.error?.title ?? 'Transition failed',
          'Close', { duration: 3000 }
        );
      },
    });
  }

  // Reserve methods
  getAuthorityLabel(): string {
    const amount = this.reserveForm.get('amount')?.value as unknown as number;
    if (!amount) return '';
    if (amount <= 10000) return '✓ Auto-approved (≤ $10,000)';
    if (amount <= 100000) return '⚠ Supervisor approval required';
    return '⚠ Manager approval required';
  }

  getAuthorityClass(): string {
    const amount = this.reserveForm.get('amount')?.value as unknown as number;
    if (!amount) return '';
    if (amount <= 10000) return 'authority-auto';
    if (amount <= 100000) return 'authority-supervisor';
    return 'authority-manager';
  }

  getTotalReserve(): number {
    return this.claim()?.reserveComponents
      .reduce((sum, rc) => sum + rc.currentAmount, 0) ?? 0;
  }

  getPendingAmount(): number {
    return this.claim()?.reserveComponents
      .flatMap(rc => rc.history)
      .filter(h => h.approvalStatus === 'PendingApproval')
      .reduce((sum, h) => sum + h.amount, 0) ?? 0;
  }

  onAddReserve(): void {
    const form = this.reserveForm.value;
    this.reservesService.create(this.claimId, {
      component: form.component,
      amount: form.amount,
      changeReason: form.changeReason,
    }).subscribe({
      next: () => {
        this.snackBar.open('Reserve added', 'Close', { duration: 3000 });
        this.showReservePanel.set(false);
        this.reserveForm.reset({ component: 'Indemnity' });
        this.loadClaim();
      },
      error: err => {
        this.snackBar.open(
          err.error?.title ?? 'Failed to add reserve',
          'Close', { duration: 3000 }
        );
      },
    });
  }

  onApproveReserve(historyId: string): void {
    this.reservesService.approve(this.claimId, historyId).subscribe({
      next: () => {
        this.snackBar.open('Reserve approved', 'Close', { duration: 3000 });
        this.loadClaim();
        this.loadAuditLog();
      },
      error: err => {
        this.snackBar.open(
          err.error?.title ?? 'Failed to approve',
          'Close', { duration: 3000 }
        );
      },
    });
  }

  onRejectReserve(historyId: string): void {
    const dialogRef = this.dialog.open(RejectReserveDialogComponent, {
      width: '480px',
    });

    dialogRef.afterClosed().subscribe(reason => {
      if (!reason) return;

      this.reservesService.reject(this.claimId, historyId, reason).subscribe({
        next: () => {
          this.snackBar.open('Reserve rejected', 'Close', { duration: 3000 });
          this.loadClaim();
          this.loadAuditLog();
        },
        error: err => {
          this.snackBar.open(
            err.error?.title ?? 'Failed to reject',
            'Close', { duration: 3000 }
          );
        },
      });
    });
  }

  onRetractReserve(historyId: string): void {
    this.reservesService.retract(this.claimId, historyId).subscribe({
      next: () => {
        this.snackBar.open('Reserve retracted', 'Close', { duration: 3000 });
        this.loadClaim();
      },
      error: err => {
        this.snackBar.open(
          err.error?.title ?? 'Failed to retract',
          'Close', { duration: 3000 }
        );
      },
    });
  }

  // Document methods
  onUploadDocument(event: Event, documentType: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.documentsService.upload(this.claimId, file, documentType)
      .subscribe({
        next: () => {
          this.snackBar.open('Document uploaded', 'Close', { duration: 3000 });
          this.loadClaim();
        },
        error: () => {
          this.snackBar.open('Upload failed', 'Close', { duration: 3000 });
        },
      });
  }

  onDeleteDocument(documentId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Document',
        message: 'Are you sure you want to delete this document?',
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.documentsService.delete(this.claimId, documentId).subscribe({
        next: () => {
          this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
          this.loadClaim();
        },
      });
    });
  }

  isSubmitter(history: ReserveHistoryDto): boolean {
    return history.submittedByUserId === this.authService.currentUser().id;
  }

  onBack(): void {
    this.router.navigate(['/claims']);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.snackBar.open('Copied to clipboard', 'Close', { duration: 2000 });
  }

  getAssetIcon(assetType: string): string {
    const icons: Record<string, string> = {
      Vehicle: 'directions_car',
      Property: 'home',
      Person: 'person',
      Equipment: 'build',
      Other: 'category',
    };
    return icons[assetType] ?? 'category';
  }

  onDownloadDocument(doc: any): void {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank');
      return;
    }

    if (doc.blobPath) {
      const url = this.documentsService.getDownloadUrl(doc.blobPath);
      window.open(url, '_blank');
      return;
    }

    this.snackBar.open('Download URL not available', 'Close', { duration: 3000 });
  }

  onAddParty(): void {
    const form = this.partyForm.value;
    this.claimsService.addParty(this.claimId, {
      partyRole: form.partyRole,
      partyType: form.partyType,
      firstName: form.firstName || null,
      lastName: form.lastName || null,
      companyName: form.companyName || null,
      email: form.email || null,
      phone: form.phone || null,
    }).subscribe({
      next: () => {
        this.snackBar.open('Party added', 'Close', { duration: 3000 });
        this.showPartyForm.set(false);
        this.partyForm.reset({ partyRole: 'Claimant', partyType: 'Person' });
        this.loadClaim();
      },
      error: err => {
        this.snackBar.open(
          err.error?.title ?? 'Failed to add party',
          'Close', { duration: 3000 }
        );
      },
    });
  }

  onAddRiskObject(): void {
    const form = this.riskObjectForm.value;
    this.claimsService.addRiskObject(this.claimId, {
      assetType: form.assetType,
      assetDescription: form.assetDescription,
      damageDescription: form.damageDescription || null,
      isPrimary: form.isPrimary ?? false,
      assetReference: form.assetReference || null,
    }).subscribe({
      next: () => {
        this.snackBar.open('Risk object added', 'Close', { duration: 3000 });
        this.showRiskObjectForm.set(false);
        this.riskObjectForm.reset({ assetType: 'Vehicle', isPrimary: false });
        this.loadClaim();
      },
      error: err => {
        this.snackBar.open(
          err.error?.title ?? 'Failed to add risk object',
          'Close', { duration: 3000 }
        );
      },
    });
  }

  getUserName(userId: string | undefined): string {
    if (!userId) return 'System';
    return '...' + userId.slice(-5);
  }
}