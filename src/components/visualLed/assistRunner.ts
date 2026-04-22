import {
  angleDistance,
  clamp,
  collectAssistSamples,
  dominantAssistAngles,
  fallbackAssistCorners,
  getAssistRoi,
  isAssistQuadUsable,
  lineIntersection,
  linesForAssistAngle,
  orderQuadPoints,
  refineCornersByEdgeSnap,
  type AssistProposal,
  type Quad,
  type ScreenElement,
} from '../../lib/visualLed';

/**
 * Run the full assist analysis pipeline on the current canvas image.
 * Matches the legacy `analyzeAssist()` decision tree:
 *   1. Edge-snap refinement of the selected element's corners.
 *   2. If that fails — dominant-angles → line-pair → quad.
 *   3. If that fails — fallback corners derived from the element itself.
 *
 * Returns a typed proposal ready for the renderer / AssistPanel, or
 * `null` if there's nothing usable (no background image, no selection).
 */
export async function runAssistAnalysis(
  canvas: HTMLCanvasElement,
  selectedElement: ScreenElement | null,
): Promise<AssistProposal | null> {
  if (!selectedElement) return null;

  const roi = getAssistRoi(selectedElement.corners, canvas.width, canvas.height);

  // Snapshot the ROI into a working canvas so we can getImageData
  // without touching the main rendering context.
  const probe = document.createElement('canvas');
  probe.width = roi.width;
  probe.height = roi.height;
  const probeCtx = probe.getContext('2d', { willReadFrequently: true });
  if (!probeCtx) return null;
  probeCtx.drawImage(
    canvas,
    roi.x,
    roi.y,
    roi.width,
    roi.height,
    0,
    0,
    roi.width,
    roi.height,
  );
  let imageData: ImageData;
  try {
    imageData = probeCtx.getImageData(0, 0, probe.width, probe.height);
  } catch {
    // Tainted canvas — we can't analyse it.
    return null;
  }

  const samples = collectAssistSamples(imageData);
  // Convert target corners into ROI-local space for the algorithms.
  const localTargetCorners = selectedElement.corners.map((p) => ({
    x: p.x - roi.x,
    y: p.y - roi.y,
  })) as Quad;

  // 1. Edge-snap refinement — usually the tightest fit if the current
  //    outline is already close to the real edges.
  const snapped = refineCornersByEdgeSnap(localTargetCorners, samples);
  if (snapped && isAssistQuadUsable(snapped.corners, roi)) {
    const globalCorners = snapped.corners.map((p) => ({
      x: p.x + roi.x,
      y: p.y + roi.y,
    })) as Quad;
    return {
      corners: globalCorners,
      confidence: snapped.avgMove > 8 ? 'high' : 'medium',
      score: Number(clamp(snapped.avgMove / 24, 0.55, 0.9).toFixed(3)),
      reason: 'Контур перестроен относительно текущего экрана (edge-snap)',
      source: 'edge-snap',
      roi,
      guides: snapped.lines.map((line) => ({
        nx: line.nx,
        ny: line.ny,
        d: line.d + line.nx * roi.x + line.ny * roi.y,
      })),
      targetElementId: selectedElement.id,
      analyzedAt: Date.now(),
    };
  }

  // 2. Dominant angles → line pairs → intersect.
  const dominant = dominantAssistAngles(samples);
  if (!dominant) {
    return {
      corners: fallbackAssistCorners(canvas.width, canvas.height, selectedElement.corners),
      confidence: 'low',
      score: 0.2,
      reason: 'Недостаточно опорных линий — предложен текущий контур',
      source: 'fallback',
      roi,
      guides: [],
      targetElementId: selectedElement.id,
      analyzedAt: Date.now(),
    };
  }

  const familyA = linesForAssistAngle(samples, dominant[0]);
  const familyB = linesForAssistAngle(samples, dominant[1]);
  if (!familyA || !familyB) {
    return {
      corners: fallbackAssistCorners(canvas.width, canvas.height, selectedElement.corners),
      confidence: 'low',
      score: 0.3,
      reason: 'Границы нестабильны — предложен текущий контур',
      source: 'fallback',
      roi,
      guides: [],
      targetElementId: selectedElement.id,
      analyzedAt: Date.now(),
    };
  }

  const p00 = lineIntersection(familyA[0], familyB[0]);
  const p10 = lineIntersection(familyA[1], familyB[0]);
  const p11 = lineIntersection(familyA[1], familyB[1]);
  const p01 = lineIntersection(familyA[0], familyB[1]);
  const candidate = p00 && p10 && p11 && p01 ? orderQuadPoints([p00, p10, p11, p01]) : null;
  const usable = candidate ? isAssistQuadUsable(candidate, roi) : false;

  const roiCorners = (usable && candidate) ? candidate : fallbackAssistCorners(roi.width, roi.height, localTargetCorners);
  const globalCorners = roiCorners.map((p) => ({ x: p.x + roi.x, y: p.y + roi.y })) as Quad;

  const edgeScore = clamp(samples.length / 2800, 0, 1);
  const orthoDelta = Math.abs(angleDistance(dominant[0], dominant[1]) - Math.PI / 2) / (Math.PI / 2);
  const ortho = 1 - Math.min(orthoDelta, 1);
  const score = 0.55 * edgeScore + 0.45 * ortho;
  const confidence = score >= 0.78 ? 'high' : score >= 0.52 ? 'medium' : 'low';

  const guides = [...familyA, ...familyB].map((line) => ({
    nx: line.nx,
    ny: line.ny,
    d: line.d + line.nx * roi.x + line.ny * roi.y,
  }));

  return {
    corners: globalCorners,
    confidence: usable ? confidence : 'low',
    score: Number((usable ? score : 0.35).toFixed(3)),
    reason: usable
      ? confidence === 'high'
        ? 'Выраженные линии и стабильная геометрия'
        : 'Проверь контур и при необходимости подкорректируй'
      : 'Автоконтур нестабилен, использован fallback',
    source: usable ? 'dominant-angles' : 'fallback',
    roi,
    guides,
    targetElementId: selectedElement.id,
    analyzedAt: Date.now(),
  };
}
