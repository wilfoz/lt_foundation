import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type WorkStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface Obra {
  id: string;
  name: string;
  contractNumber: string;
  description?: string;
  status: WorkStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObraInput {
  name: string;
  contractNumber: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ObraApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/v1/obras';

  private readonly _obras = signal<Obra[]>([]);
  readonly all = this._obras.asReadonly();

  async loadAll(): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<{ items: Obra[]; total: number }>(this.BASE),
    );
    this._obras.set(res.items);
  }

  async create(data: CreateObraInput): Promise<Obra> {
    const obra = await firstValueFrom(this.http.post<Obra>(this.BASE, data));
    this._obras.update((list) => [obra, ...list]);
    return obra;
  }

  async archive(id: string): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.BASE}/${id}/archive`, {}));
    this._obras.update((list) =>
      list.map((o): Obra => (o.id === id ? { ...o, status: 'ARCHIVED' } : o)),
    );
  }

  findById(id: string): Obra | undefined {
    return this._obras().find((o) => o.id === id);
  }

  async getById(id: string): Promise<Obra> {
    const cached = this.findById(id);
    if (cached) return cached;
    return firstValueFrom(this.http.get<Obra>(`${this.BASE}/${id}`));
  }
}
