import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../shared/material/material.module';
import { ClaimsService } from '../../core/services/claims.service';
import { ReferenceService } from '../../core/services/reference.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { CauseOfLossCode, PolicyDto } from '../../core/models/reference.models';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-fnol',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  templateUrl: './fnol.component.html',
  styleUrl: './fnol.component.scss',
})
export class FnolComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private claimsService = inject(ClaimsService);
  private referenceService = inject(ReferenceService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // State
  loading = signal(false);
  causeOfLossCodes = signal<CauseOfLossCode[]>([]);
  filteredPolicies = signal<PolicyDto[]>([]);
  selectedPolicy = signal<PolicyDto | null>(null);

  // Step 1 form
  step1Form: FormGroup = this.fb.group({
    policySearch: [''],
    unknownPolicy: [false],
    policyId: [null],
    policyNumber: [''],
    clientName: [''],
    lossDate: ['', Validators.required],
    causeOfLossCode: ['', Validators.required],
    lossDescription: ['', [Validators.required, Validators.minLength(20)]],
    lossLocation: [''],
    estimatedLossAmount: [null],
    policeReportNumber: [''],
  });

  // Step 2 form
  step2Form: FormGroup = this.fb.group({
    parties: this.fb.array([]),
    riskObjects: this.fb.array([]),
  });

  // Step 3 form
  step3Form: FormGroup = this.fb.group({
    hasInitialReserve: [false],
    initialReserveComponent: ['Indemnity'],
    initialReserveAmount: [null],
  });

  // Getters for form arrays
  get parties(): FormArray {
    return this.step2Form.get('parties') as FormArray;
  }

  get riskObjects(): FormArray {
    return this.step2Form.get('riskObjects') as FormArray;
  }

  partyRoles = ['Claimant', 'Insured', 'ThirdParty', 'Witness', 'Attorney'];
  partyTypes = ['Person', 'Company'];
  assetTypes = ['Vehicle', 'Property', 'Person', 'Equipment', 'Other'];
  reserveComponents = ['Indemnity', 'Expense', 'ALAE', 'SubrogationRecoverable'];

  ngOnInit(): void {
    this.loadCauseOfLossCodes();
    this.setupPolicySearch();
  }

  loadCauseOfLossCodes(): void {
    this.referenceService.getCauseOfLossCodes().subscribe({
      next: codes => this.causeOfLossCodes.set(codes),
    });
  }

  setupPolicySearch(): void {
    this.step1Form.get('policySearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => term && term.length >= 2
        ? this.referenceService.searchPolicies(term)
        : of([]))
    ).subscribe(policies => this.filteredPolicies.set(policies));
  }

  onPolicySelected(policy: PolicyDto): void {
    this.selectedPolicy.set(policy);
    this.step1Form.patchValue({
      policyId: policy.policyId,
      policyNumber: policy.policyNumber,
      clientName: policy.clientName,
    });
  }

  getPolicyStatusColor(): string {
    const policy = this.selectedPolicy();
    const lossDate = this.step1Form.get('lossDate')?.value;
    if (!policy || !lossDate) return '';

    const loss = new Date(lossDate);
    const effective = new Date(policy.effectiveDate);
    const expiration = new Date(policy.expirationDate);

    return loss >= effective && loss <= expiration ? 'active' : 'expired';
  }

  getPolicyStatusLabel(): string {
    const color = this.getPolicyStatusColor();
    if (!color) return '';
    return color === 'active' ? '✓ In Force' : '⚠ Outside Coverage Period';
  }

  getAuthorityLabel(): string {
    const amount = this.step3Form.get('initialReserveAmount')?.value;
    if (!amount) return '';
    if (amount <= 10000) return '✓ Auto-approved (≤ $10,000)';
    if (amount <= 100000) return '⚠ Supervisor approval required';
    return '⚠ Manager approval required';
  }

  getAuthorityClass(): string {
    const amount = this.step3Form.get('initialReserveAmount')?.value;
    if (!amount) return '';
    if (amount <= 10000) return 'authority-auto';
    if (amount <= 100000) return 'authority-supervisor';
    return 'authority-manager';
  }

  hasClaimant(): boolean {
    return this.parties.controls.some(
      p => p.get('partyRole')?.value === 'Claimant'
    );
  }

  addParty(): void {
    this.parties.push(this.fb.group({
      partyRole: ['Claimant', Validators.required],
      partyType: ['Person', Validators.required],
      firstName: [''],
      lastName: [''],
      companyName: [''],
      email: [''],
      phone: [''],
    }));
  }

  removeParty(index: number): void {
    this.parties.removeAt(index);
  }

  addRiskObject(): void {
    this.riskObjects.push(this.fb.group({
      assetType: ['Vehicle', Validators.required],
      assetDescription: ['', Validators.required],
      damageDescription: [''],
      isPrimary: [false],
      assetReference: [''],
    }));
  }

  removeRiskObject(index: number): void {
    this.riskObjects.removeAt(index);
  }

  isStep1Valid(): boolean {
    return this.step1Form.valid ||
      (this.step1Form.get('unknownPolicy')?.value === true &&
        this.step1Form.get('lossDate')?.valid === true &&
        this.step1Form.get('causeOfLossCode')?.valid === true &&
        this.step1Form.get('lossDescription')?.valid === true);
  }

  isStep2Valid(): boolean {
    return this.hasClaimant();
  }

  async onSubmit(): Promise<void> {
    if (!this.isStep1Valid() || !this.isStep2Valid()) return;

    const step1 = this.step1Form.value;
    const step2 = this.step2Form.value;
    const step3 = this.step3Form.value;

    let lossDate: string;
    if (step1.lossDate instanceof Date) {
      const d = new Date(step1.lossDate);
      d.setHours(12, 0, 0, 0);
      lossDate = d.toISOString();
    } else {
      lossDate = step1.lossDate;
    }

    const command = {
      policyId: step1.policyId,
      policyNumber: step1.policyNumber || null,
      clientName: step1.clientName || null,
      lossDate: lossDate,
      lossDescription: step1.lossDescription,
      lossLocation: step1.lossLocation || null,
      causeOfLossCode: step1.causeOfLossCode,
      estimatedLossAmount: step1.estimatedLossAmount || null,
      policeReportNumber: step1.policeReportNumber || null,
      initialReserveAmount: step3.hasInitialReserve
        ? step3.initialReserveAmount
        : null,
      initialReserveComponent: step3.hasInitialReserve
        ? step3.initialReserveComponent
        : null,
    };

    this.loading.set(true);

    this.claimsService.create(command).pipe(
      switchMap((claimId: any) => {
        // Strip quotes from returned Guid
        const id = typeof claimId === 'string'
          ? claimId.replace(/"/g, '')
          : claimId;

        // Build party requests
        const partyRequests = this.parties.controls.map(party =>
          this.claimsService.addParty(id, {
            partyRole: party.get('partyRole')?.value,
            partyType: party.get('partyType')?.value,
            firstName: party.get('firstName')?.value || null,
            lastName: party.get('lastName')?.value || null,
            companyName: party.get('companyName')?.value || null,
            email: party.get('email')?.value || null,
            phone: party.get('phone')?.value || null,
          })
        );

        // Build risk object requests
        const riskObjectRequests = this.riskObjects.controls.map(obj =>
          this.claimsService.addRiskObject(id, {
            assetType: obj.get('assetType')?.value,
            assetDescription: obj.get('assetDescription')?.value,
            damageDescription: obj.get('damageDescription')?.value || null,
            isPrimary: obj.get('isPrimary')?.value ?? false,
            assetReference: obj.get('assetReference')?.value || null,
          })
        );

        // Fire all requests in parallel then return the claimId
        const allRequests = [...partyRequests, ...riskObjectRequests];

        return allRequests.length > 0
          ? forkJoin(allRequests).pipe(
            switchMap(() => of(id))
          )
          : of(id);
      })
    ).subscribe({
      next: (id: any) => {
        this.loading.set(false);
        this.snackBar.open(
          'Claim created successfully!',
          'Close',
          { duration: 4000 }
        );
        this.router.navigate(['/claims', id]);
      },
      error: (err) => {
        const message = err.error?.title ?? 'Failed to create claim';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.loading.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/claims']);
  }
}