import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-justification-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './justification-dialog.component.html',
})
export class JustificationDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<JustificationDialogComponent>);

  form = this.fb.group({
    justification: ['', [Validators.required, Validators.minLength(10)]],
  });

  onConfirm(): void {
    if (this.form.valid)
      this.dialogRef.close(this.form.value.justification);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}