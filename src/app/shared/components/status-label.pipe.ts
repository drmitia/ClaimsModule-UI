import { Pipe, PipeTransform } from '@angular/core';
import { ClaimStatus } from '../../core/models/claim.models';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: ClaimStatus): string {
    const labels: Record<ClaimStatus, string> = {
      Draft: 'Draft',
      Open: 'Open',
      UnderInvestigation: 'Under Investigation',
      PendingPayment: 'Pending Payment',
      Closed: 'Closed',
      Reopened: 'Reopened',
      Withdrawn: 'Withdrawn',
    };
    return labels[status] ?? status;
  }
}