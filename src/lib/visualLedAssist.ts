export type AssistPoint = { x: number; y: number };

export type AssistLine = {
  nx: number;
  ny: number;
  d: number;
};

export type AssistConfidence = 'high' | 'medium' | 'low';

export type AssistSource = 'auto' | 'fallback';

export type AssistResult = {
  source: AssistSource;
  confidence: AssistConfidence;
  score: number;
  confidenceReason: string;
  dominantAnglesDeg: [number, number] | null;
  guides: AssistLine[];
  corners: [AssistPoint, AssistPoint, AssistPoint, AssistPoint];
};

type Sample = {
  x: number;
  y: number;
  angle: number;
  magnitude: number;
};

export type ImageDataLike = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wrapHalfPi(angle: number): number {
  let result = angle % Math.PI;
  if (result < 0) result += Math.PI;
  return result;
}

function angleDistance(a: number, b: number): number {
  const delta = Math.abs(wrapHalfPi(a) - wrapHalfPi(b));
  return Math.min(delta, Math.PI - delta);
}

function dot(nx: number, ny: number, p: AssistPoint): number {
  return nx * p.x + ny * p.y;
}

function intersect(l1: AssistLine, l2: AssistLine): AssistPoint | null {
  const det = l1.nx * l2.ny - l2.nx * l1.ny;
  if (Math.abs(det) < 1e-6) return null;
  const x = (l1.d * l2.ny - l2.d * l1.ny) / det;
  const y = (l1.nx * l2.d - l2.nx * l1.d) / det;
  return { x, y };
}

function polygonArea(points: AssistPoint[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(sum) * 0.5;
}

export function orderQuadPoints(points: AssistPoint[]): [AssistPoint, AssistPoint, AssistPoint, AssistPoint] {
  const center = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 },
  );
  const sorted = [...points].sort(
    (a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x),
  );

  let topLeftIndex = 0;
  let best = Infinity;
  for (let i = 0; i < sorted.length; i += 1) {
    const score = sorted[i].x + sorted[i].y;
    if (score < best) {
      best = score;
      topLeftIndex = i;
    }
  }

  const ordered = [
    sorted[topLeftIndex],
    sorted[(topLeftIndex + 1) % 4],
    sorted[(topLeftIndex + 2) % 4],
    sorted[(topLeftIndex + 3) % 4],
  ] as [AssistPoint, AssistPoint, AssistPoint, AssistPoint];
  return ordered;
}

function getLuma(data: Uint8ClampedArray, width: number, x: number, y: number): number {
  const i = (y * width + x) * 4;
  const r = data[i] || 0;
  const g = data[i + 1] || 0;
  const b = data[i + 2] || 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function collectEdgeSamples(image: ImageDataLike, step = 2): Sample[] {
  const samples: Sample[] = [];
  const { width, height, data } = image;
  const gradientThreshold = 42;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const gx = getLuma(data, width, x + 1, y) - getLuma(data, width, x - 1, y);
      const gy = getLuma(data, width, x, y + 1) - getLuma(data, width, x, y - 1);
      const magnitude = Math.hypot(gx, gy);
      if (magnitude < gradientThreshold) continue;

      // Tangent orientation is orthogonal to gradient direction.
      const lineAngle = wrapHalfPi(Math.atan2(gy, gx) + HALF_PI);
      samples.push({ x, y, angle: lineAngle, magnitude });
    }
  }
  return samples;
}

function dominantAngles(samples: Sample[]): [number, number] | null {
  if (samples.length < 80) return null;
  const bins = 36;
  const hist = new Array<number>(bins).fill(0);
  const binToAngle = (idx: number) => (idx / bins) * Math.PI;

  for (const sample of samples) {
    const idx = Math.floor((wrapHalfPi(sample.angle) / Math.PI) * bins) % bins;
    hist[idx] += sample.magnitude;
  }

  let first = -1;
  let firstValue = -1;
  for (let i = 0; i < bins; i += 1) {
    if (hist[i] > firstValue) {
      firstValue = hist[i];
      first = i;
    }
  }
  if (first < 0) return null;

  const firstAngle = binToAngle(first);
  let second = -1;
  let secondValue = -1;
  for (let i = 0; i < bins; i += 1) {
    const candidate = binToAngle(i);
    if (angleDistance(candidate, firstAngle) < (20 * Math.PI) / 180) continue;
    if (hist[i] > secondValue) {
      secondValue = hist[i];
      second = i;
    }
  }
  if (second < 0 || secondValue <= 0) return null;

  return [binToAngle(first), binToAngle(second)];
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = clamp(Math.round((sorted.length - 1) * p), 0, sorted.length - 1);
  return sorted[idx];
}

function linesForAngle(samples: Sample[], angle: number): AssistLine[] | null {
  const tolerance = (12 * Math.PI) / 180;
  const oriented = samples.filter((s) => angleDistance(s.angle, angle) <= tolerance);
  if (oriented.length < 40) return null;

  // Line normal.
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  const projections = oriented.map((s) => dot(nx, ny, s));
  const dMin = percentile(projections, 0.1);
  const dMax = percentile(projections, 0.9);
  return [
    { nx, ny, d: dMin },
    { nx, ny, d: dMax },
  ];
}

function fallbackQuad(width: number, height: number): [AssistPoint, AssistPoint, AssistPoint, AssistPoint] {
  const w = width;
  const h = height;
  return [
    { x: w * 0.32, y: h * 0.33 },
    { x: w * 0.68, y: h * 0.36 },
    { x: w * 0.72, y: h * 0.72 },
    { x: w * 0.28, y: h * 0.7 },
  ];
}

function isQuadUsable(quad: AssistPoint[], width: number, height: number): boolean {
  const area = polygonArea(quad);
  const imageArea = width * height;
  if (area < imageArea * 0.01) return false;
  if (area > imageArea * 0.9) return false;
  for (const p of quad) {
    if (p.x < -width * 0.1 || p.y < -height * 0.1 || p.x > width * 1.1 || p.y > height * 1.1) {
      return false;
    }
  }
  return true;
}

function confidenceFrom(score: number): AssistConfidence {
  if (score >= 0.78) return 'high';
  if (score >= 0.52) return 'medium';
  return 'low';
}

export function analyzeAssistFromImageData(image: ImageDataLike): AssistResult {
  const { width, height } = image;
  const samples = collectEdgeSamples(image, 2);
  const angles = dominantAngles(samples);

  if (!angles) {
    return {
      source: 'fallback',
      confidence: 'low',
      score: 0.2,
      confidenceReason: 'Недостаточно выраженных линий на фото',
      dominantAnglesDeg: null,
      guides: [],
      corners: fallbackQuad(width, height),
    };
  }

  const familyA = linesForAngle(samples, angles[0]);
  const familyB = linesForAngle(samples, angles[1]);
  if (!familyA || !familyB) {
    return {
      source: 'fallback',
      confidence: 'low',
      score: 0.3,
      confidenceReason: 'Не удалось стабильно выделить границы',
      dominantAnglesDeg: [angles[0] * (180 / Math.PI), angles[1] * (180 / Math.PI)],
      guides: [],
      corners: fallbackQuad(width, height),
    };
  }

  const p00 = intersect(familyA[0], familyB[0]);
  const p10 = intersect(familyA[1], familyB[0]);
  const p11 = intersect(familyA[1], familyB[1]);
  const p01 = intersect(familyA[0], familyB[1]);

  if (!p00 || !p10 || !p11 || !p01) {
    return {
      source: 'fallback',
      confidence: 'low',
      score: 0.28,
      confidenceReason: 'Линии почти параллельны, пересечения нестабильны',
      dominantAnglesDeg: [angles[0] * (180 / Math.PI), angles[1] * (180 / Math.PI)],
      guides: [],
      corners: fallbackQuad(width, height),
    };
  }

  const ordered = orderQuadPoints([p00, p10, p11, p01]);
  if (!isQuadUsable(ordered, width, height)) {
    return {
      source: 'fallback',
      confidence: 'low',
      score: 0.35,
      confidenceReason: 'Предложенный контур слишком мал/велик или вне кадра',
      dominantAnglesDeg: [angles[0] * (180 / Math.PI), angles[1] * (180 / Math.PI)],
      guides: [...familyA, ...familyB],
      corners: fallbackQuad(width, height),
    };
  }

  const edgeStrength = clamp(samples.length / 2800, 0, 1);
  const ortho = 1 - Math.min(Math.abs(angleDistance(angles[0], angles[1]) - HALF_PI) / HALF_PI, 1);
  const areaScore = clamp(polygonArea(ordered) / (width * height * 0.2), 0, 1);
  const score = 0.45 * edgeStrength + 0.3 * ortho + 0.25 * areaScore;
  const confidence = confidenceFrom(score);

  return {
    source: 'auto',
    confidence,
    score: Number(score.toFixed(3)),
    confidenceReason:
      confidence === 'high'
        ? 'Выраженные линии и стабильная геометрия'
        : confidence === 'medium'
          ? 'Линии найдены, но геометрия требует проверки'
          : 'Низкая уверенность — проверьте контур вручную',
    dominantAnglesDeg: [angles[0] * (180 / Math.PI), angles[1] * (180 / Math.PI)],
    guides: [...familyA, ...familyB],
    corners: ordered,
  };
}

export function buildAssistFromFallback(width: number, height: number): AssistResult {
  return {
    source: 'fallback',
    confidence: 'low',
    score: 0.2,
    confidenceReason: 'Использован ручной fallback',
    dominantAnglesDeg: null,
    guides: [],
    corners: fallbackQuad(width, height),
  };
}

export function lineClipToRect(line: AssistLine, width: number, height: number): [AssistPoint, AssistPoint] | null {
  const points: AssistPoint[] = [];
  const eps = 1e-6;
  if (Math.abs(line.ny) > eps) {
    const yLeft = (line.d - line.nx * 0) / line.ny;
    const yRight = (line.d - line.nx * width) / line.ny;
    if (yLeft >= 0 && yLeft <= height) points.push({ x: 0, y: yLeft });
    if (yRight >= 0 && yRight <= height) points.push({ x: width, y: yRight });
  }
  if (Math.abs(line.nx) > eps) {
    const xTop = (line.d - line.ny * 0) / line.nx;
    const xBottom = (line.d - line.ny * height) / line.nx;
    if (xTop >= 0 && xTop <= width) points.push({ x: xTop, y: 0 });
    if (xBottom >= 0 && xBottom <= width) points.push({ x: xBottom, y: height });
  }
  if (points.length < 2) return null;
  const unique: AssistPoint[] = [];
  for (const point of points) {
    if (!unique.some((u) => Math.hypot(u.x - point.x, u.y - point.y) < 0.5)) {
      unique.push(point);
    }
  }
  if (unique.length < 2) return null;
  return [unique[0], unique[1]];
}

export function angleToDeg(angle: number): number {
  let value = (angle * 180) / Math.PI;
  value %= 180;
  if (value < 0) value += 180;
  return value;
}

export function radFromDeg(deg: number): number {
  return (deg / 180) * Math.PI;
}

export function normalizeAngleDeg(deg: number): number {
  let result = deg % 180;
  if (result < 0) result += 180;
  return result;
}

export function polarLineFromDeg(deg: number, d: number): AssistLine {
  const a = radFromDeg(deg);
  return {
    nx: -Math.sin(a),
    ny: Math.cos(a),
    d,
  };
}

export function degDistance(a: number, b: number): number {
  const da = normalizeAngleDeg(a);
  const db = normalizeAngleDeg(b);
  const diff = Math.abs(da - db);
  return Math.min(diff, 180 - diff);
}

export function averageAngles(angles: number[]): number | null {
  if (!angles.length) return null;
  let sumX = 0;
  let sumY = 0;
  for (const angle of angles) {
    // Double-angle trick for 180-degree periodicity.
    sumX += Math.cos((angle * TWO_PI) / 180);
    sumY += Math.sin((angle * TWO_PI) / 180);
  }
  if (Math.abs(sumX) < 1e-8 && Math.abs(sumY) < 1e-8) return null;
  const avg = (Math.atan2(sumY, sumX) * 180) / TWO_PI;
  return normalizeAngleDeg(avg * 2);
}
