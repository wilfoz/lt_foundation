import { Tower } from '../entities/tower.entity';
import { ValidationResultDto } from '@lt/shared-dtos';

export class ValidationService {
  validate(tower: Tower): ValidationResultDto[] {
    const results: ValidationResultDto[] = [];

    if (!tower.type || !tower.Hu) {
      results.push({ id: 'V-001', severity: 'BLOCKING', message: 'Torre deve ter tipo, extensão e Hu preenchidos.' });
    }

    if (!tower.deflectionAngle) {
      results.push({ id: 'V-009', severity: 'BLOCKING', message: 'Ângulo de deflexão é obrigatório.' });
    }

    if (tower.isSelfSupporting()) {
      if (tower.legs.length !== 4) {
        results.push({ id: 'V-003', severity: 'BLOCKING', message: 'Torre autoportante deve ter exatamente 4 pernas (A, B, C, D).' });
      }
      for (const leg of tower.legs) {
        if (!leg.foundation) {
          results.push({ id: 'V-005', severity: 'BLOCKING', message: `Perna ${leg.id}: fundação não selecionada.`, elementId: leg.id });
        }
        if (!leg.surveyPoint) {
          results.push({ id: 'V-008', severity: 'BLOCKING', message: `Perna ${leg.id}: cotas Nc/Ncc não preenchidas.`, elementId: leg.id });
        }
        if (!leg.stub) {
          results.push({ id: 'V-011', severity: 'BLOCKING', message: `Perna ${leg.id}: stub não selecionado.`, elementId: leg.id });
        }
      }
    }

    if (tower.isGuyed()) {
      const mc = tower.getElement('MC');
      if (!mc) {
        results.push({ id: 'V-201', severity: 'BLOCKING', message: 'Mastro Central (MC) não definido.' });
      }
      const stays = tower.guyedElements.filter((e) => e.id !== 'MC');
      if (stays.length !== 4) {
        results.push({ id: 'V-202', severity: 'BLOCKING', message: 'Torre estaiada deve ter exatamente 4 estais (A, B, C, D).' });
      }
      for (const el of tower.guyedElements) {
        if (!el.foundation) {
          results.push({ id: 'V-005', severity: 'BLOCKING', message: `Elemento ${el.id}: fundação não selecionada.`, elementId: el.id });
        }
        if (!el.surveyPoint) {
          results.push({ id: 'V-008', severity: 'BLOCKING', message: `Elemento ${el.id}: cotas não preenchidas.`, elementId: el.id });
        }
        if (!el.stub) {
          results.push({ id: 'V-011', severity: 'BLOCKING', message: `Elemento ${el.id}: stub não selecionado.`, elementId: el.id });
        }
      }
    }

    return results;
  }

  assertEmissionAllowed(validations: ValidationResultDto[]): void {
    const blockers = validations.filter((v) => v.severity === 'BLOCKING');
    if (blockers.length > 0) {
      throw new Error(`EMISSION_BLOCKED: ${blockers.map((b) => b.id).join(', ')}`);
    }
  }
}
