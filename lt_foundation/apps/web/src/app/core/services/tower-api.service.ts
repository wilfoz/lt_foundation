import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TowerDto, CreateTowerDto, CalculationResultDto } from '@lt/shared-dtos';

@Injectable({ providedIn: 'root' })
export class TowerApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1';

  getTowers(): Observable<TowerDto[]> {
    return this.http.get<TowerDto[]>(`${this.base}/towers`);
  }

  getTower(id: string): Observable<TowerDto> {
    return this.http.get<TowerDto>(`${this.base}/towers/${id}`);
  }

  createTower(dto: CreateTowerDto): Observable<TowerDto> {
    return this.http.post<TowerDto>(`${this.base}/towers`, dto);
  }

  deleteTower(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/towers/${id}`);
  }

  selectFoundationForLeg(towerId: string, legId: string, body: { kind: string; catalogRefId: string; azimuth?: number }): Observable<unknown> {
    return this.http.put(`${this.base}/towers/${towerId}/legs/${legId}/foundation`, body);
  }

  updateLeg(towerId: string, legId: string, body: unknown): Observable<unknown> {
    return this.http.put(`${this.base}/towers/${towerId}/legs/${legId}`, body);
  }

  selectFoundationForElement(towerId: string, elementId: string, body: { kind: string; catalogRefId: string; azimuth?: number }): Observable<unknown> {
    return this.http.put(`${this.base}/towers/${towerId}/elements/${elementId}/foundation`, body);
  }

  updateElement(towerId: string, elementId: string, body: unknown): Observable<unknown> {
    return this.http.put(`${this.base}/towers/${towerId}/elements/${elementId}`, body);
  }

  calculate(towerId: string): Observable<CalculationResultDto> {
    return this.http.post<CalculationResultDto>(`${this.base}/towers/${towerId}/calculate`, {});
  }

  getValidations(towerId: string): Observable<{ validations: any[] }> {
    return this.http.get<{ validations: any[] }>(`${this.base}/towers/${towerId}/validations`);
  }

  getCatalog(kind?: 'CAISSON' | 'FOOTING'): Observable<any[]> {
    const params = kind ? `?kind=${kind}` : '';
    return this.http.get<any[]>(`${this.base}/catalog/foundations${params}`);
  }

  downloadSpreadsheet(towerId: string, draft = false): Observable<Blob> {
    return this.http.post(`${this.base}/towers/${towerId}/spreadsheet`, { format: 'XLSX', draft }, { responseType: 'blob' });
  }
}
