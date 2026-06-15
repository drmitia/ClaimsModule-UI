import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-reject-reserve-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './reject-reserve-dialog.component.html',
})
export class RejectReserveDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<RejectReserveDialogComponent>);

  form = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  onConfirm(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.reason);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}