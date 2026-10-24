import { describe, expect, it } from 'vitest';
import { contrastIssues, contrastRatio, parseColor } from './contrast';

describe('contraste', () => {
  it('lê hex, rgb e hsl', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255, 1]);
    expect(parseColor('#00000080')![3]).toBeCloseTo(0.5, 2);
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual([255, 0, 0, 0.5]);
    expect(parseColor('rgb(0 0 255 / 50%)')).toEqual([0, 0, 255, 0.5]);
    expect(parseColor('hsl(0, 100%, 50%)')!.slice(0, 3).map(Math.round)).toEqual([255, 0, 0]);
    expect(parseColor('red')).toBeNull();
  });

  it('preto e branco dão 21:1', () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 1);
  });

  it('acusa texto sobre o destaque com pouco contraste e ignora o que passa', () => {
    const issues = contrastIssues({ 'color.bg': '#0b1020', 'color.text': '#ffffff', 'color.accent': '#ffffff', 'color.onAccent': '#eeeeee' });
    expect(issues.map((i) => i.text)).toEqual(['color.onAccent']);
  });

  it('compõe a superfície translúcida sobre o fundo', () => {
    const issues = contrastIssues({ 'color.bg': '#000000', 'color.surface': 'rgba(255, 255, 255, 0.9)', 'color.text': '#ffffff' });
    expect(issues.map((i) => i.background)).toEqual(['color.surface']);
  });
});
