import { Component, Input } from '@angular/core';
import { StatusLabelPipe } from './status-label.pipe';
import { ClaimStatus } from '../../core/models/claim.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [StatusLabelPipe],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input() status!: ClaimStatus;
}
