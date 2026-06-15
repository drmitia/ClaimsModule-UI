import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private http = inject(HttpClient);
  private baseUrl = (claimId: string) =>
    `${environment.apiUrl}/api/claims/${claimId}/documents`;

  upload(
    claimId: string,
    file: File,
    documentType: string
  ): Observable<HttpEvent<string>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return this.http.post<string>(this.baseUrl(claimId), formData, {
      reportProgress: true,
      observe: 'events',
    });
  }

  delete(claimId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl(claimId)}/${documentId}`
    );
  }

  getDownloadUrl(blobPath: string): string {
    const cleanPath = blobPath.replace(/\\/g, '/');
    return `${environment.apiUrl}/files/${cleanPath}`;
  }
}