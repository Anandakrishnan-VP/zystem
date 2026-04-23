

## Muscle Tracker — Anatomical Outline + Tiered Glow

Refactor `src/components/MuscleTracker.tsx` to give each muscle a clean anatomical outline, a 3-tier color system based on absolute training frequency thresholds, and a flame-like glow effect on each muscle group.

### 1. New tier-based color logic (replace ratio system)

Thresholds depend on the active `timeRange`:

| Tier | Color | Weekly | Monthly | Yearly |
|---|---|---|---|---|
| **High** | Purple `hsl(270 80% 60%)` | ≥ 2 days | ≥ 6 days | ≥ 60 days |
| **Mid** | Red `hsl(0 80% 55%)` | = 1 day | 2–5 days | 24–59 days |
| **Low/None** | Yellow `hsl(50 95% 55%)` | 0 days | 0–1 days | 0–23 days |

```ts
const getTier = (count: number, range: TimeRange) => {
  const t = { weekly:[2,1], monthly:[6,2], yearly:[60,24] }[range];
  if (count >= t[0]) return 'high';
  if (count >= t[1]) return 'mid';
  return 'low';
};
```

Maps to fill color + glow color. Pass `timeRange` into `FrontDiagram` / `BackDiagram`.

### 2. Anatomical outline + graphic look

Wrap each diagram with a body silhouette outline (head, torso, arms, legs as connected `<path>`s with `stroke="hsl(var(--foreground))"`, `fill="none"`, `strokeWidth="1.5"`) so the figure reads as a coherent body, not floating shapes. Increase muscle stroke width to `2`, keep fill opacity high (`0.85`) for graphic-novel feel. Add subtle inner stroke lines (already present on abs) to chest, back, quads, shoulders for muscle definition.

### 3. Flame/glow effect per muscle

Add an SVG `<defs>` block in each diagram with a reusable `<filter id="flameGlow">`:

```xml
<filter id="flameGlow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="2.5" result="blur" />
  <feMerge>
    <feMergeNode in="blur" />
    <feMergeNode in="blur" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

Apply `filter="url(#flameGlow)"` to every muscle shape. The glow color naturally inherits from each muscle's fill (purple/red/yellow), creating individual flame auras. Add a CSS keyframe `flicker` on `index.css` (subtle 1.2s opacity 0.85↔1) and apply via `className="animate-flicker"` for the "flamy" pulse — only on muscles in `high` or `mid` tier (low stays static).

### 4. Update legend & checklist

- Legend becomes 3 items: Purple (High), Red (Mid), Yellow (Low) with threshold tooltip text adapted to active range.
- Checklist buttons reuse the same tier color for border/background consistency.

### Files

- **edit** `src/components/MuscleTracker.tsx` — tier logic, outline paths, SVG filter defs, glow application, updated legend
- **edit** `src/index.css` — add `@keyframes flicker` and `.animate-flicker` utility

