import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CauseOfLossCode, PolicyDto } from '../models/reference.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReferenceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/reference`;

  getCauseOfLossCodes(): Observable<CauseOfLossCode[]> {
    return this.http.get<CauseOfLossCode[]>(
      `${this.baseUrl}/cause-of-loss-codes`
    );
  }

  searchPolicies(term: string): Observable<PolicyDto[]> {
    const params = new HttpParams().set('term', term);
    return this.http.get<PolicyDto[]>(`${this.baseUrl}/policies/search`, {
      params,
    });
  }
}