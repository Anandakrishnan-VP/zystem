import { useMuscleTraining, MUSCLE_LABELS, MuscleGroup, TimeRange } from '@/hooks/useMuscleTraining';
import { Check } from 'lucide-react';
import anatomyFront from '@/assets/anatomy-front.jpg';

// Color scale: purple (most) → gold → green → red (least but trained)
const getHeatColor = (count: number, maxCount: number): string => {
  if (count === 0) return 'transparent';
  if (maxCount === 0) return 'transparent';
  const ratio = count / maxCount;
  if (ratio >= 0.75) return 'hsl(270 80% 55%)';  // purple - most trained
  if (ratio >= 0.5) return 'hsl(45 95% 55%)';    // gold
  if (ratio >= 0.25) return 'hsl(142 65% 45%)';  // green
  return 'hsl(0 75% 50%)';                        // red - least trained
};

const getOpacity = (count: number): number => (count > 0 ? 0.55 : 0);

/**
 * Muscle overlay regions, calibrated to the anatomical reference image.
 * Coordinates are percentage-based (% of image width/height) so they scale.
 * Each region uses an SVG ellipse/path positioned absolutely over the photo.
 */
type Region = { cx: number; cy: number; rx: number; ry: number; rot?: number };

const FRONT_REGIONS: Record<string, Region[]> = {
  neck:      [{ cx: 50, cy: 17, rx: 4, ry: 3 }],
  traps:     [{ cx: 42, cy: 21, rx: 6, ry: 2.5 }, { cx: 58, cy: 21, rx: 6, ry: 2.5 }],
  shoulders: [{ cx: 33, cy: 26, rx: 6, ry: 5 }, { cx: 67, cy: 26, rx: 6, ry: 5 }],
  chest:     [{ cx: 41, cy: 32, rx: 8, ry: 6 }, { cx: 59, cy: 32, rx: 8, ry: 6 }],
  biceps:    [{ cx: 27, cy: 36, rx: 4, ry: 7, rot: -8 }, { cx: 73, cy: 36, rx: 4, ry: 7, rot: 8 }],
  triceps:   [{ cx: 24, cy: 38, rx: 3, ry: 6, rot: -8 }, { cx: 76, cy: 38, rx: 3, ry: 6, rot: 8 }],
  forearms:  [{ cx: 21, cy: 48, rx: 3.5, ry: 7 }, { cx: 79, cy: 48, rx: 3.5, ry: 7 }],
  abs:       [{ cx: 50, cy: 44, rx: 7, ry: 9 }],
  obliques:  [{ cx: 39, cy: 46, rx: 3, ry: 8 }, { cx: 61, cy: 46, rx: 3, ry: 8 }],
  quads:     [{ cx: 42, cy: 67, rx: 6, ry: 11 }, { cx: 58, cy: 67, rx: 6, ry: 11 }],
  hamstrings:[{ cx: 42, cy: 70, rx: 5, ry: 9 }, { cx: 58, cy: 70, rx: 5, ry: 9 }], // not visible front, faint
  glutes:    [{ cx: 50, cy: 60, rx: 6, ry: 3 }], // hip line hint
  calves:    [{ cx: 43, cy: 86, rx: 4, ry: 7 }, { cx: 57, cy: 86, rx: 4, ry: 7 }],
  upper_back:[], // back-only
  lower_back:[], // back-only
};

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  weekly: '7 Days',
  monthly: '30 Days',
  yearly: '365 Days',
};

const AnatomyOverlay = ({ counts, maxCount }: {
  counts: Record<string, number>;
  maxCount: number;
}) => {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <img
        src={anatomyFront}
        alt="Human anatomy frontal view"
        className="w-full h-auto select-none pointer-events-none"
        draggable={false}
      />
      {/* SVG overlay matches image aspect ratio */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply"
      >
        {Object.entries(FRONT_REGIONS).map(([muscle, regions]) => {
          const count = counts[muscle] || 0;
          const color = getHeatColor(count, maxCount);
          const opacity = getOpacity(count);
          if (opacity === 0) return null;
          return (
            <g key={muscle}>
              {regions.map((r, i) => (
                <ellipse
                  key={i}
                  cx={r.cx}
                  cy={r.cy}
                  rx={r.rx}
                  ry={r.ry}
                  fill={color}
                  fillOpacity={opacity}
                  transform={r.rot ? `rotate(${r.rot} ${r.cx} ${r.cy})` : undefined}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const MuscleTracker = () => {
  const { loading, toggleMuscle, getMuscleCounts, isTodayTrained, timeRange, setTimeRange } = useMuscleTraining();

  if (loading) {
    return (
      <div className="border border-foreground p-4">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Loading muscle tracker...</p>
      </div>
    );
  }

  const counts = getMuscleCounts();
  const maxCount = Math.max(...Object.values(counts), 1);

  const muscleCategories = [
    { label: 'Upper Body', muscles: ['chest', 'upper_back', 'shoulders', 'traps', 'neck'] as MuscleGroup[] },
    { label: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] as MuscleGroup[] },
    { label: 'Core', muscles: ['abs', 'obliques', 'lower_back'] as MuscleGroup[] },
    { label: 'Lower Body', muscles: ['glutes', 'quads', 'hamstrings', 'calves'] as MuscleGroup[] },
  ];

  return (
    <div className="border border-foreground">
      <div className="px-4 py-3 border-b border-foreground flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest">Muscle Tracker</h3>
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
            heat map • tap to log today
          </p>
        </div>
        <div className="flex gap-1">
          {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`font-mono text-[9px] uppercase tracking-wider px-2 py-1 border transition-colors ${
                timeRange === r
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-muted-foreground/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Anatomical photo with color-coded muscle heatmap overlay */}
      <div className="p-4 flex justify-center bg-muted/10">
        <AnatomyOverlay counts={counts} maxCount={maxCount} />
      </div>

      {/* Muscle checklist */}
      <div className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {muscleCategories.map(cat => (
            <div key={cat.label}>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">
                {cat.label}
              </p>
              <div className="space-y-1">
                {cat.muscles.map(muscle => {
                  const trained = isTodayTrained(muscle);
                  const count = counts[muscle] || 0;
                  const color = count > 0 ? getHeatColor(count, maxCount) : 'hsl(var(--muted-foreground) / 0.2)';
                  return (
                    <button
                      key={muscle}
                      onClick={() => toggleMuscle(muscle)}
                      className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider border transition-all"
                      style={{
                        borderColor: trained ? color : 'hsl(var(--muted-foreground) / 0.2)',
                        backgroundColor: trained ? color : 'transparent',
                        color: trained ? '#000' : 'hsl(var(--foreground))',
                      }}
                    >
                      {trained && <Check size={10} strokeWidth={3} />}
                      <span className="truncate">{MUSCLE_LABELS[muscle]}</span>
                      {count > 0 && (
                        <span className="ml-auto text-[8px] opacity-70">{count}d</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-muted-foreground/20">
          <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground mb-1">
            {TIME_RANGE_LABELS[timeRange]} frequency
          </p>
          <div className="flex gap-3">
            {[
              { color: 'hsl(270 80% 55%)', label: 'Most' },
              { color: 'hsl(45 95% 55%)', label: 'High' },
              { color: 'hsl(142 65% 45%)', label: 'Mid' },
              { color: 'hsl(0 75% 50%)', label: 'Low' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5" style={{ backgroundColor: item.color }} />
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
