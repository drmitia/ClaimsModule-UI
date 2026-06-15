import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClaimSummaryDto,
  ClaimDetailDto,
  PaginatedList,
  AuditLogDto,
  TransitionResultDto,
  ValidationResultDto,
} from '../models/claim.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/claims`;

  list(params: {
    pageNumber?: number;
    pageSize?: number;
    status?: string;
    searchTerm?: string;
  }): Observable<PaginatedList<ClaimSummaryDto>> {
    let httpParams = new HttpParams();
    if (params.pageNumber)
      httpParams = httpParams.set('pageNumber', params.pageNumber);
    if (params.pageSize)
      httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.status)
      httpParams = httpParams.set('status', params.status);
    if (params.searchTerm)
      httpParams = httpParams.set('searchTerm', params.searchTerm);

    return this.http.get<PaginatedList<ClaimSummaryDto>>(this.baseUrl, {
      params: httpParams,
    });
  }

  getById(id: string): Observable<ClaimDetailDto> {
    return this.http.get<ClaimDetailDto>(`${this.baseUrl}/${id}`);
  }

  create(command: any): Observable<string> {
    return this.http.post(this.baseUrl, command, {
      responseType: 'text'
    });
  }
  transition(
    id: string,
    command: any
  ): Observable<TransitionResultDto> {
    return this.http.post<TransitionResultDto>(
      `${this.baseUrl}/${id}/transition`,
      command
    );
  }

  validate(id: string): Observable<ValidationResultDto> {
    return this.http.post<ValidationResultDto>(
      `${this.baseUrl}/${id}/validate`,
      {}
    );
  }

  getAuditLog(id: string): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.baseUrl}/${id}/audit-log`);
  }

  addParty(claimId: string, party: any): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/${claimId}/parties`,
      party
    );
  }

  addRiskObject(claimId: string, riskObject: any): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/${claimId}/risk-objects`,
      riskObject
    );
  }
}