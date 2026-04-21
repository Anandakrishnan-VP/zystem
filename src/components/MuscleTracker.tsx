import { useMuscleTraining, MUSCLE_LABELS, MuscleGroup, TimeRange } from '@/hooks/useMuscleTraining';
import { Check } from 'lucide-react';

// Color scale: purple (most) → gold → green → red (least but trained)
const getHeatColor = (count: number, maxCount: number): string => {
  if (count === 0) return 'hsl(var(--muted))';
  if (maxCount === 0) return 'hsl(var(--muted))';
  
  const ratio = count / maxCount;
  if (ratio >= 0.75) return 'hsl(270 70% 55%)';  // purple - most trained
  if (ratio >= 0.5) return 'hsl(45 90% 55%)';    // gold
  if (ratio >= 0.25) return 'hsl(142 60% 45%)';  // green
  return 'hsl(0 70% 50%)';                        // red - least trained
};

const getFillOpacity = (count: number): number => {
  return count > 0 ? 0.7 : 0.15;
};

// Body silhouette path (anatomical proportions)
const BODY_FILL = 'hsl(var(--muted) / 0.25)';
const BODY_STROKE = 'hsl(var(--foreground) / 0.5)';

// Anatomical front-view body
const FrontDiagram = ({ counts, maxCount }: {
  counts: Record<string, number>;
  maxCount: number;
}) => {
  const mc = (m: MuscleGroup) => getHeatColor(counts[m] || 0, maxCount);
  const mo = (m: MuscleGroup) => getFillOpacity(counts[m] || 0);

  return (
    <svg viewBox="0 0 220 440" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Body silhouette — head, neck, torso, arms, legs */}
      <g fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1.2" strokeLinejoin="round">
        {/* Head */}
        <ellipse cx="110" cy="32" rx="20" ry="25" />
        {/* Neck */}
        <path d="M 100,55 Q 110,62 120,55 L 122,72 Q 110,76 98,72 Z" />
        {/* Torso silhouette (shoulders → waist → hips) */}
        <path d="M 70,78 Q 85,72 110,72 Q 135,72 150,78 L 156,118 Q 152,160 148,200 Q 145,215 140,225 L 80,225 Q 75,215 72,200 Q 68,160 64,118 Z" />
        {/* Left arm */}
        <path d="M 70,80 Q 56,85 52,110 Q 48,140 46,170 Q 44,195 48,215 Q 52,225 56,228 Q 62,228 64,222 Q 66,200 68,175 Q 70,140 72,110 Q 74,90 70,80 Z" />
        {/* Right arm */}
        <path d="M 150,80 Q 164,85 168,110 Q 172,140 174,170 Q 176,195 172,215 Q 168,225 164,228 Q 158,228 156,222 Q 154,200 152,175 Q 150,140 148,110 Q 146,90 150,80 Z" />
        {/* Hands */}
        <ellipse cx="56" cy="240" rx="9" ry="13" />
        <ellipse cx="164" cy="240" rx="9" ry="13" />
        {/* Left leg */}
        <path d="M 80,225 Q 75,260 76,300 Q 77,340 82,380 Q 86,400 92,410 Q 100,410 102,400 Q 104,360 104,320 Q 104,275 102,235 Z" />
        {/* Right leg */}
        <path d="M 140,225 Q 145,260 144,300 Q 143,340 138,380 Q 134,400 128,410 Q 120,410 118,400 Q 116,360 116,320 Q 116,275 118,235 Z" />
        {/* Feet */}
        <ellipse cx="93" cy="420" rx="11" ry="6" />
        <ellipse cx="127" cy="420" rx="11" ry="6" />
      </g>

      {/* === MUSCLES (front) === */}
      {/* Neck */}
      <path d="M 100,58 Q 110,64 120,58 L 121,70 Q 110,73 99,70 Z"
        fill={mc('neck')} fillOpacity={mo('neck')} stroke={mc('neck')} strokeWidth="0.8" />
      {/* Trapezius (upper) */}
      <path d="M 78,76 Q 95,72 110,75 Q 125,72 142,76 L 138,86 Q 110,90 82,86 Z"
        fill={mc('traps')} fillOpacity={mo('traps')} stroke={mc('traps')} strokeWidth="0.8" />
      {/* Deltoids (shoulders) */}
      <path d="M 64,82 Q 56,90 56,108 Q 64,114 76,110 Q 80,95 78,82 Q 72,78 64,82 Z"
        fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="0.8" />
      <path d="M 156,82 Q 164,90 164,108 Q 156,114 144,110 Q 140,95 142,82 Q 148,78 156,82 Z"
        fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="0.8" />
      {/* Pectoralis (chest) — left & right */}
      <path d="M 82,90 Q 95,86 108,90 Q 110,108 108,120 Q 95,124 82,118 Q 78,105 82,90 Z"
        fill={mc('chest')} fillOpacity={mo('chest')} stroke={mc('chest')} strokeWidth="0.8" />
      <path d="M 138,90 Q 125,86 112,90 Q 110,108 112,120 Q 125,124 138,118 Q 142,105 138,90 Z"
        fill={mc('chest')} fillOpacity={mo('chest')} stroke={mc('chest')} strokeWidth="0.8" />
      {/* Biceps */}
      <path d="M 54,108 Q 50,125 52,150 Q 58,158 64,154 Q 66,135 64,112 Q 60,106 54,108 Z"
        fill={mc('biceps')} fillOpacity={mo('biceps')} stroke={mc('biceps')} strokeWidth="0.8" />
      <path d="M 166,108 Q 170,125 168,150 Q 162,158 156,154 Q 154,135 156,112 Q 160,106 166,108 Z"
        fill={mc('biceps')} fillOpacity={mo('biceps')} stroke={mc('biceps')} strokeWidth="0.8" />
      {/* Forearms */}
      <path d="M 50,158 Q 46,180 48,210 Q 54,220 60,216 Q 62,190 60,162 Q 56,156 50,158 Z"
        fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="0.8" />
      <path d="M 170,158 Q 174,180 172,210 Q 166,220 160,216 Q 158,190 160,162 Q 164,156 170,158 Z"
        fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="0.8" />
      {/* Abdominals — 6-pack rectangles */}
      <g fill={mc('abs')} fillOpacity={mo('abs')} stroke={mc('abs')} strokeWidth="0.8">
        <rect x="92" y="122" width="11" height="13" rx="2" />
        <rect x="117" y="122" width="11" height="13" rx="2" />
        <rect x="92" y="138" width="11" height="13" rx="2" />
        <rect x="117" y="138" width="11" height="13" rx="2" />
        <rect x="92" y="154" width="11" height="13" rx="2" />
        <rect x="117" y="154" width="11" height="13" rx="2" />
        <path d="M 92,170 L 128,170 Q 120,184 110,186 Q 100,184 92,170 Z" />
      </g>
      {/* Obliques */}
      <path d="M 78,118 Q 76,150 84,180 Q 90,182 92,170 L 92,122 Z"
        fill={mc('obliques')} fillOpacity={mo('obliques')} stroke={mc('obliques')} strokeWidth="0.8" />
      <path d="M 142,118 Q 144,150 136,180 Q 130,182 128,170 L 128,122 Z"
        fill={mc('obliques')} fillOpacity={mo('obliques')} stroke={mc('obliques')} strokeWidth="0.8" />
      {/* Quadriceps */}
      <path d="M 82,232 Q 78,275 80,320 Q 86,335 96,332 Q 100,300 100,260 Q 100,238 96,232 Z"
        fill={mc('quads')} fillOpacity={mo('quads')} stroke={mc('quads')} strokeWidth="0.8" />
      <path d="M 138,232 Q 142,275 140,320 Q 134,335 124,332 Q 120,300 120,260 Q 120,238 124,232 Z"
        fill={mc('quads')} fillOpacity={mo('quads')} stroke={mc('quads')} strokeWidth="0.8" />
      {/* Calves (front-visible portions of lower leg) */}
      <path d="M 82,345 Q 80,375 86,400 Q 92,402 96,398 Q 96,375 94,345 Z"
        fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="0.8" />
      <path d="M 138,345 Q 140,375 134,400 Q 128,402 124,398 Q 124,375 126,345 Z"
        fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="0.8" />

      <text x="110" y="435" textAnchor="middle" className="fill-muted-foreground"
        style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Front</text>
    </svg>
  );
};

// Anatomical back-view body
const BackDiagram = ({ counts, maxCount }: {
  counts: Record<string, number>;
  maxCount: number;
}) => {
  const mc = (m: MuscleGroup) => getHeatColor(counts[m] || 0, maxCount);
  const mo = (m: MuscleGroup) => getFillOpacity(counts[m] || 0);

  return (
    <svg viewBox="0 0 220 440" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Body silhouette — same as front */}
      <g fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1.2" strokeLinejoin="round">
        <ellipse cx="110" cy="32" rx="20" ry="25" />
        <path d="M 100,55 Q 110,62 120,55 L 122,72 Q 110,76 98,72 Z" />
        <path d="M 70,78 Q 85,72 110,72 Q 135,72 150,78 L 156,118 Q 152,160 148,200 Q 145,215 140,225 L 80,225 Q 75,215 72,200 Q 68,160 64,118 Z" />
        <path d="M 70,80 Q 56,85 52,110 Q 48,140 46,170 Q 44,195 48,215 Q 52,225 56,228 Q 62,228 64,222 Q 66,200 68,175 Q 70,140 72,110 Q 74,90 70,80 Z" />
        <path d="M 150,80 Q 164,85 168,110 Q 172,140 174,170 Q 176,195 172,215 Q 168,225 164,228 Q 158,228 156,222 Q 154,200 152,175 Q 150,140 148,110 Q 146,90 150,80 Z" />
        <ellipse cx="56" cy="240" rx="9" ry="13" />
        <ellipse cx="164" cy="240" rx="9" ry="13" />
        <path d="M 80,225 Q 75,260 76,300 Q 77,340 82,380 Q 86,400 92,410 Q 100,410 102,400 Q 104,360 104,320 Q 104,275 102,235 Z" />
        <path d="M 140,225 Q 145,260 144,300 Q 143,340 138,380 Q 134,400 128,410 Q 120,410 118,400 Q 116,360 116,320 Q 116,275 118,235 Z" />
        <ellipse cx="93" cy="420" rx="11" ry="6" />
        <ellipse cx="127" cy="420" rx="11" ry="6" />
      </g>

      {/* === MUSCLES (back) === */}
      {/* Neck */}
      <path d="M 100,58 Q 110,64 120,58 L 121,70 Q 110,73 99,70 Z"
        fill={mc('neck')} fillOpacity={mo('neck')} stroke={mc('neck')} strokeWidth="0.8" />
      {/* Trapezius (large diamond down to mid-back) */}
      <path d="M 78,76 Q 95,72 110,75 Q 125,72 142,76 L 138,100 Q 122,108 110,108 Q 98,108 82,100 Z"
        fill={mc('traps')} fillOpacity={mo('traps')} stroke={mc('traps')} strokeWidth="0.8" />
      <path d="M 105,108 L 115,108 L 113,135 Q 110,138 107,135 Z"
        fill={mc('traps')} fillOpacity={mo('traps')} stroke={mc('traps')} strokeWidth="0.6" />
      {/* Rear deltoids */}
      <path d="M 64,82 Q 56,90 56,108 Q 64,114 76,110 Q 80,95 78,82 Q 72,78 64,82 Z"
        fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="0.8" />
      <path d="M 156,82 Q 164,90 164,108 Q 156,114 144,110 Q 140,95 142,82 Q 148,78 156,82 Z"
        fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="0.8" />
      {/* Latissimus dorsi (upper back / lats) */}
      <path d="M 80,100 Q 75,130 82,160 Q 95,168 108,160 L 108,108 Q 95,108 82,100 Z"
        fill={mc('upper_back')} fillOpacity={mo('upper_back')} stroke={mc('upper_back')} strokeWidth="0.8" />
      <path d="M 140,100 Q 145,130 138,160 Q 125,168 112,160 L 112,108 Q 125,108 138,100 Z"
        fill={mc('upper_back')} fillOpacity={mo('upper_back')} stroke={mc('upper_back')} strokeWidth="0.8" />
      {/* Triceps */}
      <path d="M 50,108 Q 46,128 48,152 Q 54,160 62,156 Q 64,135 62,112 Q 56,106 50,108 Z"
        fill={mc('triceps')} fillOpacity={mo('triceps')} stroke={mc('triceps')} strokeWidth="0.8" />
      <path d="M 170,108 Q 174,128 172,152 Q 166,160 158,156 Q 156,135 158,112 Q 164,106 170,108 Z"
        fill={mc('triceps')} fillOpacity={mo('triceps')} stroke={mc('triceps')} strokeWidth="0.8" />
      {/* Forearms */}
      <path d="M 50,158 Q 46,180 48,210 Q 54,220 60,216 Q 62,190 60,162 Q 56,156 50,158 Z"
        fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="0.8" />
      <path d="M 170,158 Q 174,180 172,210 Q 166,220 160,216 Q 158,190 160,162 Q 164,156 170,158 Z"
        fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="0.8" />
      {/* Lower back (lumbar) */}
      <path d="M 88,165 Q 85,190 92,215 L 128,215 Q 135,190 132,165 Q 110,170 88,165 Z"
        fill={mc('lower_back')} fillOpacity={mo('lower_back')} stroke={mc('lower_back')} strokeWidth="0.8" />
      {/* Glutes */}
      <ellipse cx="93" cy="240" rx="18" ry="16"
        fill={mc('glutes')} fillOpacity={mo('glutes')} stroke={mc('glutes')} strokeWidth="0.8" />
      <ellipse cx="127" cy="240" rx="18" ry="16"
        fill={mc('glutes')} fillOpacity={mo('glutes')} stroke={mc('glutes')} strokeWidth="0.8" />
      {/* Hamstrings */}
      <path d="M 82,265 Q 78,305 84,340 Q 92,348 96,344 Q 100,310 100,275 Q 100,265 96,262 Z"
        fill={mc('hamstrings')} fillOpacity={mo('hamstrings')} stroke={mc('hamstrings')} strokeWidth="0.8" />
      <path d="M 138,265 Q 142,305 136,340 Q 128,348 124,344 Q 120,310 120,275 Q 120,265 124,262 Z"
        fill={mc('hamstrings')} fillOpacity={mo('hamstrings')} stroke={mc('hamstrings')} strokeWidth="0.8" />
      {/* Calves (rear) */}
      <path d="M 82,355 Q 78,385 86,405 Q 92,407 96,402 Q 96,378 94,355 Z"
        fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="0.8" />
      <path d="M 138,355 Q 142,385 134,405 Q 128,407 124,402 Q 124,378 126,355 Z"
        fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="0.8" />

      <text x="110" y="435" textAnchor="middle" className="fill-muted-foreground"
        style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Back</text>
    </svg>
  );
};

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  weekly: '7 Days',
  monthly: '30 Days',
  yearly: '365 Days',
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

      {/* Front/Back anatomical SVG diagrams */}
      <div className="p-4 flex justify-center gap-4">
        <div className="w-1/2 max-w-[260px]">
          <FrontDiagram counts={counts} maxCount={maxCount} />
        </div>
        <div className="w-1/2 max-w-[260px]">
          <BackDiagram counts={counts} maxCount={maxCount} />
        </div>
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
                  const color = getHeatColor(count, maxCount);
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
              { color: 'hsl(270 70% 55%)', label: 'Most' },
              { color: 'hsl(45 90% 55%)', label: 'High' },
              { color: 'hsl(142 60% 45%)', label: 'Mid' },
              { color: 'hsl(0 70% 50%)', label: 'Low' },
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
