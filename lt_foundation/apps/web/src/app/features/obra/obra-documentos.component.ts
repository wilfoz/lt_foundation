import { Component, OnInit, inject, signal, ElementRef, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

interface WorkDocument {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'XLS' | 'DWG';
  pipelineStatus: 'UPLOADED' | 'PROCESSING' | 'PENDING_REVIEW' | 'REVIEWED' | 'FAILED';
  uploadedAt: string;
}

@Component({
  selector: 'lt-obra-documentos',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-800">Documentos</h2>
        <button
          (click)="fileInput().nativeElement.click()"
          [disabled]="uploading()"
          class="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {{ uploading() ? 'Enviando...' : '+ Enviar Documento' }}
        </button>
        <input #fileInputEl type="file" accept=".pdf,.xls,.xlsx,.dwg" class="hidden" (change)="onFileSelected($event)" />
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {{ error() }}
        </div>
      }

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200 flex gap-4 text-xs text-gray-500">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-gray-400 inline-block"></span> Enviado
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Processando
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> Aguarda revisão
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span> Revisado
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-red-400 inline-block"></span> Falhou
          </span>
        </div>

        @if (loading()) {
          <div class="px-5 py-10 text-center text-sm text-gray-500">Carregando documentos...</div>
        } @else if (documents().length === 0) {
          <div class="px-5 py-12 text-center text-gray-500 text-sm">
            Nenhum documento enviado.
            <p class="text-xs text-gray-400 mt-1">
              Envie planilhas XLS, PDFs ou arquivos DWG para iniciar o pipeline de ingestão.
            </p>
          </div>
        } @else {
          <div class="divide-y divide-gray-100">
            <div class="px-5 py-2.5 bg-gray-50 border-b border-gray-200 grid grid-cols-4 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span class="col-span-2">Arquivo</span>
              <span>Status</span>
              <span>Enviado em</span>
            </div>
            @for (doc of documents(); track doc.id) {
              <div class="px-5 py-3.5 grid grid-cols-4 gap-4 items-center hover:bg-gray-50 transition-colors">
                <div class="col-span-2 flex items-center gap-2.5 min-w-0">
                  <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                    {{ doc.fileType }}
                  </span>
                  <span class="text-sm text-gray-700 truncate" [title]="doc.fileName">{{ doc.fileName }}</span>
                </div>
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full shrink-0" [class]="statusDot(doc.pipelineStatus)"></span>
                  <span class="text-xs text-gray-600">{{ statusLabel(doc.pipelineStatus) }}</span>
                </span>
                <span class="text-xs text-gray-400">{{ doc.uploadedAt | date:'dd/MM/yy HH:mm' }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class ObraDocumentosComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInputEl');

  documents = signal<WorkDocument[]>([]);
  loading = signal(true);
  uploading = signal(false);
  error = signal<string | null>(null);

  private workId = '';

  ngOnInit(): void {
    this.workId = this.route.parent!.snapshot.paramMap.get('id') ?? '';
    this.loadDocuments();
  }

  private loadDocuments(): void {
    this.loading.set(true);
    this.http.get<WorkDocument[]>(`/api/v1/obras/${this.workId}/documentos`).subscribe({
      next: (data) => { this.documents.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const form = new FormData();
    form.append('file', file);

    this.uploading.set(true);
    this.error.set(null);

    this.http.post<WorkDocument>(`/api/v1/obras/${this.workId}/documentos`, form).subscribe({
      next: (doc) => {
        this.documents.update((list) => [doc, ...list]);
        this.uploading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erro ao enviar documento.');
        this.uploading.set(false);
      },
    });
  }

  statusDot(status: WorkDocument['pipelineStatus']): string {
    const map: Record<string, string> = {
      UPLOADED: 'bg-gray-400',
      PROCESSING: 'bg-blue-400',
      PENDING_REVIEW: 'bg-yellow-400',
      REVIEWED: 'bg-green-400',
      FAILED: 'bg-red-400',
    };
    return map[status] ?? 'bg-gray-300';
  }

  statusLabel(status: WorkDocument['pipelineStatus']): string {
    const map: Record<string, string> = {
      UPLOADED: 'Enviado',
      PROCESSING: 'Processando',
      PENDING_REVIEW: 'Aguarda revisão',
      REVIEWED: 'Revisado',
      FAILED: 'Falhou',
    };
    return map[status] ?? status;
  }
}
