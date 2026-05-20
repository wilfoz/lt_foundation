import { Component, Input } from '@angular/core';
import { ValidationResultDto } from '@lt/shared-dtos';

@Component({
  selector: 'lt-validation-badge',
  standalone: true,
  template: `
    <div class="flex items-start gap-2 text-xs py-1 px-2 rounded" [class]="bgClass()">
      <span class="font-mono font-medium shrink-0">{{ validation.id }}</span>
      <span class="font-semibold shrink-0">{{ labelMap[validation.severity] }}</span>
      <span class="text-gray-700">{{ validation.message }}</span>
    </div>
  `,
})
export class ValidationBadgeComponent {
  @Input({ required: true }) validation!: ValidationResultDto;

  readonly labelMap: Record<string, string> = {
    BLOCKING: 'BLOQUEANTE',
    ALERT: 'ALERTA',
    INFO: 'INFO',
  };

  bgClass() {
    if (this.validation.severity === 'BLOCKING') return 'bg-red-50 text-red-700';
    if (this.validation.severity === 'ALERT') return 'bg-yellow-50 text-yellow-700';
    return 'bg-gray-50 text-gray-600';
  }
}
