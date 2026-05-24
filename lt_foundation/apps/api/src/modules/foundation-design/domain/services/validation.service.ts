import { Tower } from '../entities/tower.entity';
import { TowerElement } from '../entities/tower-element.entity';
import { Leg } from '../entities/leg.entity';
import { ValidationResultDto } from '@lt/shared-dtos';

/** Placeholder — confirm exact limit with engineering (V-029). */
const ALFA_MAX_RAD = Math.PI / 3; // 60°

export class ValidationService {
  validate(tower: Tower): ValidationResultDto[] {
    return [
      ...this.validateTowerIdentity(tower),
      ...this.validateSelfSupportingStructure(tower),
      ...this.validateGuyedStructure(tower),
    ];
  }

  assertEmissionAllowed(validations: ValidationResultDto[]): void {
    const blockers = validations.filter((v) => v.severity === 'BLOCKING');
    if (blockers.length > 0) {
      throw new Error(`EMISSION_BLOCKED: ${blockers.map((b) => b.id).join(', ')}`);
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private validateTowerIdentity(tower: Tower): ValidationResultDto[] {
    const results: ValidationResultDto[] = [];
    if (!tower.type || !tower.Hu) {
      results.push({ id: 'V-001', severity: 'BLOCKING', message: 'Torre deve ter tipo, extensão e Hu preenchidos.' });
    }
    if (!tower.deflectionAngle) {
      results.push({ id: 'V-009', severity: 'BLOCKING', message: 'Ângulo de deflexão é obrigatório.' });
    }
    return results;
  }

  private validateSelfSupportingStructure(tower: Tower): ValidationResultDto[] {
    if (!tower.isSelfSupporting()) return [];
    const results: ValidationResultDto[] = [];
    if (tower.legs.length !== 4) {
      results.push({ id: 'V-003', severity: 'BLOCKING', message: 'Torre autoportante deve ter exatamente 4 pernas (A, B, C, D).' });
    }
    for (const leg of tower.legs) {
      results.push(...this.validateLeg(leg));
    }
    return results;
  }

  private validateLeg(leg: Leg): ValidationResultDto[] {
    const results: ValidationResultDto[] = [];
    if (!leg.foundation) {
      results.push({ id: 'V-005', severity: 'BLOCKING', message: `Perna ${leg.id}: fundação não selecionada.`, elementId: leg.id });
    }
    if (!leg.surveyPoint) {
      results.push({ id: 'V-008', severity: 'BLOCKING', message: `Perna ${leg.id}: cotas Nc/Ncc não preenchidas.`, elementId: leg.id });
    }
    if (!leg.stub) {
      results.push({ id: 'V-011', severity: 'BLOCKING', message: `Perna ${leg.id}: stub não selecionado.`, elementId: leg.id });
    }
    return results;
  }

  private validateGuyedStructure(tower: Tower): ValidationResultDto[] {
    if (!tower.isGuyed()) return [];
    const results: ValidationResultDto[] = [];

    if (!tower.getElement('MC')) {
      results.push({ id: 'V-201', severity: 'BLOCKING', message: 'Mastro Central (MC) não definido.' });
    }
    if (tower.guyedElements.filter((e) => e.id !== 'MC').length !== 4) {
      results.push({ id: 'V-202', severity: 'BLOCKING', message: 'Torre estaiada deve ter exatamente 4 estais (A, B, C, D).' });
    }
    for (const el of tower.guyedElements) {
      results.push(...this.validateGuyedElement(el));
    }
    return results;
  }

  private validateGuyedElement(el: TowerElement): ValidationResultDto[] {
    const results: ValidationResultDto[] = [];
    if (!el.foundation) {
      results.push({ id: 'V-005', severity: 'BLOCKING', message: `Elemento ${el.id}: fundação não selecionada.`, elementId: el.id });
    }
    if (!el.surveyPoint) {
      results.push({ id: 'V-008', severity: 'BLOCKING', message: `Elemento ${el.id}: cotas não preenchidas.`, elementId: el.id });
    }
    if (!el.stub) {
      results.push({ id: 'V-011', severity: 'BLOCKING', message: `Elemento ${el.id}: stub não selecionado.`, elementId: el.id });
    }
    if (el.id !== 'MC') {
      results.push(...this.validateAnchorPoint(el));
    }
    return results;
  }

  private validateAnchorPoint(el: TowerElement): ValidationResultDto[] {
    const ap = el.anchorPoint;
    if (!ap) return [];
    const results: ValidationResultDto[] = [];

    if (ap.cotaPF <= 0) {
      results.push({ id: 'V-030', severity: 'BLOCKING', message: `Estai ${el.id}: cotaPF inválida (deve ser > 0).`, elementId: el.id });
    }
    if (ap.alfa != null && Math.abs(ap.alfa) > ALFA_MAX_RAD) {
      results.push({ id: 'V-029', severity: 'ALERT', message: `Estai ${el.id}: inclinação do terreno (alfa) fora do limite aceitável.`, elementId: el.id });
    }
    if (ap.cableCutLength != null && ap.cableCutLength <= 0) {
      results.push({ id: 'V-031', severity: 'BLOCKING', message: `Estai ${el.id}: comprimento de cabo calculado ≤ 0.`, elementId: el.id });
    }
    return results;
  }
}
