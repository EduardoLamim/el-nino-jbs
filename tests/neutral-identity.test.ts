import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { areaPlans, validatePlanActions } from '../src/content/area-plans';

describe('Identidade neutra PRD', () => {
  it('aceita categoria legada sem reescrever procedimentos ou responsáveis', () => {
    const action = { ...areaPlans.TI!.acoes[0]!, 'Nível': 'Impacto JBS' };
    expect(validatePlanActions([action])).toEqual([{ ...action, 'Nível': 'Impacto Operacional' }]);
    expect(action['Nível']).toBe('Impacto JBS');
    expect(JSON.stringify(areaPlans)).not.toMatch(/\bJBS\b/);
  });
  it('remove logo e preserva nome e localidade', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain('Monitoramento El Niño');
    expect(app).toContain('Santa Catarina');
    expect(app).not.toContain('jbs-terminais-branco');
    expect(existsSync('src/assets/jbs-terminais-branco.png')).toBe(false);
    expect(readFileSync('index.html', 'utf8')).toContain('<title>Monitoramento El Niño</title>');
  });
  it('usa exatamente o mapa determinístico homologado, sem duplicar o JPEG anterior', () => {
    expect(createHash('sha256').update(readFileSync('public/assets/operacoes-posicionamento-equipamentos.png')).digest('hex')).toBe('1abf53162582bc9aabb19bbeca90f74ba28eb10fb521b3e793b4c4225592a4aa');
    expect(existsSync('public/assets/operacoes-posicionamento-equipamentos.jpg')).toBe(false);
    expect(readFileSync('src/components/DecisionMap.tsx', 'utf8')).toContain('operacoes-posicionamento-equipamentos.png');
  });
});
