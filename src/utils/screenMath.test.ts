import {
  estimateDistance,
  recommendHeight,
  recommendWidth,
  selectPitch,
  recommendInstall,
  estimatePower,
  calculate,
  pitchOptions,
} from './screenMath';
import { expect } from 'vitest';
import type { CalcInputs } from './screenMath';

describe('estimateDistance', () => {
  it('возвращает положительное число', () => {
    expect(estimateDistance(100)).toBeGreaterThan(0);
  });

  it('растёт с увеличением аудитории', () => {
    expect(estimateDistance(1000)).toBeGreaterThan(estimateDistance(100));
  });

  it('для 100 зрителей ≈ 20 м', () => {
    expect(estimateDistance(100)).toBeCloseTo(20, 0);
  });
});

describe('recommendHeight', () => {
  it('для presentation делитель = 5', () => {
    expect(recommendHeight(10, 'presentation')).toBe(2);
  });

  it('для video делитель = 6', () => {
    expect(recommendHeight(12, 'video')).toBe(2);
  });

  it('для branding делитель = 7', () => {
    expect(recommendHeight(14, 'branding')).toBe(2);
  });

  it('округляет до 0.5 м', () => {
    const h = recommendHeight(11, 'video');
    expect(h * 2).toBe(Math.round(h * 2));
  });
});

describe('recommendWidth', () => {
  it('для conference соотношение 16:9', () => {
    const w = recommendWidth(2, 'conference', null);
    expect(w).toBeCloseTo(3.5, 0);
  });

  it('для concert соотношение 3:1', () => {
    const w = recommendWidth(2, 'concert', null);
    expect(w).toBe(6);
  });

  it('ограничивает шириной сцены', () => {
    const w = recommendWidth(2, 'concert', 4);
    expect(w).toBeLessThanOrEqual(4);
  });
});

describe('selectPitch', () => {
  it('для близкой дистанции выбирает мелкий шаг', () => {
    const p = selectPitch(2, 'video', 'indoor', pitchOptions);
    expect(p.value).toBeLessThanOrEqual(3.9);
  });

  it('для дальней дистанции выбирает крупный шаг', () => {
    const p = selectPitch(25, 'video', 'indoor', pitchOptions);
    expect(p.value).toBeGreaterThanOrEqual(8);
  });

  it('для presentation сдвигает на мельче', () => {
    const pVideo = selectPitch(5, 'video', 'indoor', pitchOptions);
    const pPres = selectPitch(5, 'presentation', 'indoor', pitchOptions);
    expect(pPres.value).toBeLessThanOrEqual(pVideo.value);
  });

  it('для branding сдвигает на крупнее', () => {
    const pVideo = selectPitch(5, 'video', 'indoor', pitchOptions);
    const pBrand = selectPitch(5, 'branding', 'indoor', pitchOptions);
    expect(pBrand.value).toBeGreaterThanOrEqual(pVideo.value);
  });

  it('для outdoor минимум P3.9', () => {
    const p = selectPitch(2, 'video', 'outdoor', pitchOptions);
    expect(p.value).toBeGreaterThanOrEqual(3.9);
  });
});

describe('recommendInstall', () => {
  it('outdoor → уличная конструкция', () => {
    expect(recommendInstall('outdoor', 'unknown')).toContain('Уличная');
  });

  it('indoor hanging → подвес', () => {
    expect(recommendInstall('indoor', 'hanging')).toBe('Подвес');
  });

  it('indoor floor → напольная', () => {
    expect(recommendInstall('indoor', 'floor')).toContain('Напольная');
  });
});

describe('estimatePower', () => {
  it('возвращает avg и peak строки', () => {
    const p = estimatePower(10);
    expect(p.avg).toContain('кВт');
    expect(p.peak).toContain('кВт');
  });

  it('peak > avg', () => {
    const p = estimatePower(10);
    const avgMax = parseFloat(p.avg.split('–')[1]);
    const peakMax = parseFloat(p.peak.replace(/[^\d.]/g, ''));
    expect(peakMax).toBeGreaterThan(avgMax);
  });
});

describe('calculate', () => {
  const baseInputs: CalcInputs = {
    eventType: 'conference',
    location: 'indoor',
    audience: 200,
    distanceKnown: false,
    distance: 0,
    purpose: 'video',
    stageWidth: null,
    maxHeight: null,
    installType: 'unknown',
  };

  it('возвращает все обязательные поля', () => {
    const r = calculate(baseInputs);
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
    expect(r.area).toBeGreaterThan(0);
    expect(r.distance).toBeGreaterThan(0);
    expect(r.pitch).toBeDefined();
    expect(r.installRecommendation).toBeTruthy();
    expect(r.powerAvg).toContain('кВт');
    expect(r.powerPeak).toContain('кВт');
    expect(Array.isArray(r.warnings)).toBe(true);
    expect(Array.isArray(r.explanations)).toBe(true);
  });

  it('учитывает ограничение maxHeight', () => {
    const r = calculate({ ...baseInputs, maxHeight: 1.5 });
    expect(r.height).toBeLessThanOrEqual(1.5);
    expect(r.warnings.some((w: string) => w.includes('потолком'))).toBe(true);
  });

  it('учитывает ограничение stageWidth', () => {
    const r = calculate({ ...baseInputs, stageWidth: 2 });
    expect(r.width).toBeLessThanOrEqual(2);
  });

  it('использует заданную дистанцию если distanceKnown', () => {
    const r = calculate({ ...baseInputs, distanceKnown: true, distance: 30 });
    expect(r.distance).toBe(30);
  });

  it('для outdoor выбирает минимум P3.9', () => {
    const r = calculate({ ...baseInputs, location: 'outdoor', distanceKnown: true, distance: 2 });
    expect(r.pitch.value).toBeGreaterThanOrEqual(3.9);
  });

  it('explanations содержит пояснения', () => {
    const r = calculate(baseInputs);
    expect(r.explanations.length).toBeGreaterThan(0);
  });
});