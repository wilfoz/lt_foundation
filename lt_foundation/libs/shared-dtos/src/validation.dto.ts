export type ValidationSeverity = 'BLOCKING' | 'ALERT' | 'INFO';

export interface ValidationResultDto {
  id: string;
  severity: ValidationSeverity;
  message: string;
  elementId?: string;
}
