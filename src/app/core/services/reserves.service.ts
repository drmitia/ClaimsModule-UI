import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReservesService {
  private http = inject(HttpClient);
  private baseUrl = (claimId: string) =>
    `${environment.apiUrl}/api/claims/${claimId}/reserves`;

  create(claimId: string, command: any): Observable<string> {
    return this.http.post<string>(this.baseUrl(claimId), command);
  }

  approve(claimId: string, reserveHistoryId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl(claimId)}/${reserveHistoryId}/approve`,
      {}
    );
  }

  reject(
    claimId: string,
    reserveHistoryId: string,
    reason: string
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl(claimId)}/${reserveHistoryId}/reject`,
      { rejectionReason: reason }
    );
  }

  retract(claimId: string, reserveHistoryId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl(claimId)}/${reserveHistoryId}/retract`,
      {}
    );
  }
}