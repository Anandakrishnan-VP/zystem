import { useMuscleTraining, MUSCLE_LABELS, MuscleGroup, TimeRange } from '@/hooks/useMuscleTraining';
import { Check } from 'lucide-react';

type Tier = 'high' | 'mid' | 'low';

const TIER_COLORS: Record<Tier, string> = {
  high: 'hsl(270 80% 60%)',
  mid: 'hsl(0 80% 55%)',
  low: 'hsl(50 95% 55%)',
};

const getTier = (count: number, range: TimeRange): Tier => {
  const t = { weekly: [2, 1], monthly: [6, 2], yearly: [60, 24] }[range];
  if (count >= t[0]) return 'high';
  if (count >= t[1]) return 'mid';
  return 'low';
};

const getMuscleColor = (count: number, range: TimeRange) => TIER_COLORS[getTier(count, range)];
const isAnimated = (count: number, range: TimeRange) => getTier(count, range) !== 'low';

// Shared SVG defs: glow filter
const GlowDefs = ({ id }: { id: string }) => (
  <defs>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// Body silhouette outline (front)
const FrontSilhouette = () => (
  <g fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.55" strokeLinejoin="round" strokeLinecap="round">
    {/* Head */}
    <ellipse cx="100" cy="32" rx="18" ry="22" />
    {/* Neck → shoulders → arms → torso → legs as one continuous outline */}
    <path d="M 90,52 L 90,60 Q 70,62 56,76 Q 40,90 38,118 L 36,170 Q 36,182 42,194 L 50,196 Q 58,184 58,170 L 62,118 Q 64,108 72,102 L 78,108 L 80,160 Q 80,180 84,200 L 80,260 Q 78,300 80,335 L 92,338 Q 96,300 100,260 Q 104,300 108,338 L 120,335 Q 122,300 120,260 L 116,200 Q 120,180 120,160 L 122,108 L 128,102 Q 136,108 138,118 L 142,170 Q 142,184 150,196 L 158,194 Q 164,182 164,170 L 162,118 Q 160,90 144,76 Q 130,62 110,60 L 110,52 Z" />
  </g>
);

const BackSilhouette = () => (
  <g fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.55" strokeLinejoin="round" strokeLinecap="round">
    <ellipse cx="100" cy="32" rx="18" ry="22" />
    <path d="M 90,52 L 90,60 Q 70,62 56,76 Q 40,90 38,118 L 36,170 Q 36,182 42,194 L 50,196 Q 58,184 58,170 L 62,118 Q 64,108 72,102 L 78,108 L 80,160 Q 80,180 84,200 L 80,260 Q 78,300 80,335 L 92,338 Q 96,300 100,260 Q 104,300 108,338 L 120,335 Q 122,300 120,260 L 116,200 Q 120,180 120,160 L 122,108 L 128,102 Q 136,108 138,118 L 142,170 Q 142,184 150,196 L 158,194 Q 164,182 164,170 L 162,118 Q 160,90 144,76 Q 130,62 110,60 L 110,52 Z" />
  </g>
);

// Front-view muscle body SVG
const FrontDiagram = ({ counts, range }: { counts: Record<string, number>; range: TimeRange }) => {
  const mc = (m: MuscleGroup) => getMuscleColor(counts[m] || 0, range);
  const cls = (m: MuscleGroup) => isAnimated(counts[m] || 0, range) ? 'animate-flicker' : '';
  const f = 'url(#flameGlowFront)';

  return (
    <svg viewBox="0 0 200 400" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <GlowDefs id="flameGlowFront" />
      <FrontSilhouette />

      <rect x="92" y="52" width="16" height="14" rx="3" fill={mc('neck')} fillOpacity="0.85" stroke={mc('neck')} strokeWidth="2" filter={f} className={cls('neck')} />
      <polygon points="76,66 92,58 92,72 76,76" fill={mc('traps')} fillOpacity="0.85" stroke={mc('traps')} strokeWidth="2" filter={f} className={cls('traps')} />
      <polygon points="124,66 108,58 108,72 124,76" fill={mc('traps')} fillOpacity="0.85" stroke={mc('traps')} strokeWidth="2" filter={f} className={cls('traps')} />
      <ellipse cx="68" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity="0.85" stroke={mc('shoulders')} strokeWidth="2" filter={f} className={cls('shoulders')} />
      <ellipse cx="132" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity="0.85" stroke={mc('shoulders')} strokeWidth="2" filter={f} className={cls('shoulders')} />
      <path d="M 78,78 Q 100,72 122,78 L 118,108 Q 100,114 82,108 Z" fill={mc('chest')} fillOpacity="0.85" stroke={mc('chest')} strokeWidth="2" filter={f} className={cls('chest')} />
      <line x1="100" y1="78" x2="100" y2="110" stroke={mc('chest')} strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="58" cy="110" rx="8" ry="20" fill={mc('biceps')} fillOpacity="0.85" stroke={mc('biceps')} strokeWidth="2" transform="rotate(-10 58 110)" filter={f} className={cls('biceps')} />
      <ellipse cx="142" cy="110" rx="8" ry="20" fill={mc('biceps')} fillOpacity="0.85" stroke={mc('biceps')} strokeWidth="2" transform="rotate(10 142 110)" filter={f} className={cls('biceps')} />
      <ellipse cx="48" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity="0.85" stroke={mc('forearms')} strokeWidth="2" transform="rotate(-5 48 150)" filter={f} className={cls('forearms')} />
      <ellipse cx="152" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity="0.85" stroke={mc('forearms')} strokeWidth="2" transform="rotate(5 152 150)" filter={f} className={cls('forearms')} />
      <rect x="88" y="110" width="24" height="50" rx="4" fill={mc('abs')} fillOpacity="0.85" stroke={mc('abs')} strokeWidth="2" filter={f} className={cls('abs')} />
      {[122, 134, 146].map(y => (<line key={y} x1="90" y1={y} x2="110" y2={y} stroke={mc('abs')} strokeWidth="0.8" opacity="0.6" />))}
      <line x1="100" y1="112" x2="100" y2="158" stroke={mc('abs')} strokeWidth="0.8" opacity="0.6" />
      <polygon points="82,110 88,110 86,160 78,156" fill={mc('obliques')} fillOpacity="0.85" stroke={mc('obliques')} strokeWidth="2" filter={f} className={cls('obliques')} />
      <polygon points="118,110 112,110 114,160 122,156" fill={mc('obliques')} fillOpacity="0.85" stroke={mc('obliques')} strokeWidth="2" filter={f} className={cls('obliques')} />
      <ellipse cx="84" cy="225" rx="14" ry="38" fill={mc('quads')} fillOpacity="0.85" stroke={mc('quads')} strokeWidth="2" filter={f} className={cls('quads')} />
      <ellipse cx="116" cy="225" rx="14" ry="38" fill={mc('quads')} fillOpacity="0.85" stroke={mc('quads')} strokeWidth="2" filter={f} className={cls('quads')} />
      <line x1="84" y1="200" x2="84" y2="255" stroke={mc('quads')} strokeWidth="0.8" opacity="0.5" />
      <line x1="116" y1="200" x2="116" y2="255" stroke={mc('quads')} strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="82" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity="0.85" stroke={mc('calves')} strokeWidth="2" filter={f} className={cls('calves')} />
      <ellipse cx="118" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity="0.85" stroke={mc('calves')} strokeWidth="2" filter={f} className={cls('calves')} />

      <text x="100" y="392" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Front</text>
    </svg>
  );
};

// Back-view muscle body SVG
const BackDiagram = ({ counts, range }: { counts: Record<string, number>; range: TimeRange }) => {
  const mc = (m: MuscleGroup) => getMuscleColor(counts[m] || 0, range);
  const cls = (m: MuscleGroup) => isAnimated(counts[m] || 0, range) ? 'animate-flicker' : '';
  const f = 'url(#flameGlowBack)';

  return (
    <svg viewBox="0 0 200 400" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <GlowDefs id="flameGlowBack" />
      <BackSilhouette />

      <rect x="92" y="52" width="16" height="14" rx="3" fill={mc('neck')} fillOpacity="0.85" stroke={mc('neck')} strokeWidth="2" filter={f} className={cls('neck')} />
      <path d="M 76,66 L 92,58 L 100,62 L 108,58 L 124,66 L 120,82 Q 100,88 80,82 Z" fill={mc('traps')} fillOpacity="0.85" stroke={mc('traps')} strokeWidth="2" filter={f} className={cls('traps')} />
      <ellipse cx="68" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity="0.85" stroke={mc('shoulders')} strokeWidth="2" filter={f} className={cls('shoulders')} />
      <ellipse cx="132" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity="0.85" stroke={mc('shoulders')} strokeWidth="2" filter={f} className={cls('shoulders')} />
      <path d="M 80,82 Q 100,78 120,82 L 122,120 Q 100,126 78,120 Z" fill={mc('upper_back')} fillOpacity="0.85" stroke={mc('upper_back')} strokeWidth="2" filter={f} className={cls('upper_back')} />
      <line x1="100" y1="82" x2="100" y2="120" stroke={mc('upper_back')} strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="55" cy="110" rx="9" ry="20" fill={mc('triceps')} fillOpacity="0.85" stroke={mc('triceps')} strokeWidth="2" transform="rotate(-10 55 110)" filter={f} className={cls('triceps')} />
      <ellipse cx="145" cy="110" rx="9" ry="20" fill={mc('triceps')} fillOpacity="0.85" stroke={mc('triceps')} strokeWidth="2" transform="rotate(10 145 110)" filter={f} className={cls('triceps')} />
      <ellipse cx="48" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity="0.85" stroke={mc('forearms')} strokeWidth="2" transform="rotate(-5 48 150)" filter={f} className={cls('forearms')} />
      <ellipse cx="152" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity="0.85" stroke={mc('forearms')} strokeWidth="2" transform="rotate(5 152 150)" filter={f} className={cls('forearms')} />
      <rect x="84" y="122" width="32" height="30" rx="5" fill={mc('lower_back')} fillOpacity="0.85" stroke={mc('lower_back')} strokeWidth="2" filter={f} className={cls('lower_back')} />
      <line x1="100" y1="82" x2="100" y2="155" stroke="hsl(var(--foreground))" strokeWidth="0.6" opacity="0.4" />
      <ellipse cx="88" cy="172" rx="16" ry="14" fill={mc('glutes')} fillOpacity="0.85" stroke={mc('glutes')} strokeWidth="2" filter={f} className={cls('glutes')} />
      <ellipse cx="112" cy="172" rx="16" ry="14" fill={mc('glutes')} fillOpacity="0.85" stroke={mc('glutes')} strokeWidth="2" filter={f} className={cls('glutes')} />
      <ellipse cx="84" cy="228" rx="14" ry="38" fill={mc('hamstrings')} fillOpacity="0.85" stroke={mc('hamstrings')} strokeWidth="2" filter={f} className={cls('hamstrings')} />
      <ellipse cx="116" cy="228" rx="14" ry="38" fill={mc('hamstrings')} fillOpacity="0.85" stroke={mc('hamstrings')} strokeWidth="2" filter={f} className={cls('hamstrings')} />
      <line x1="84" y1="205" x2="84" y2="258" stroke={mc('hamstrings')} strokeWidth="0.8" opacity="0.5" />
      <line x1="116" y1="205" x2="116" y2="258" stroke={mc('hamstrings')} strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="82" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity="0.85" stroke={mc('calves')} strokeWidth="2" filter={f} className={cls('calves')} />
      <ellipse cx="118" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity="0.85" stroke={mc('calves')} strokeWidth="2" filter={f} className={cls('calves')} />

      <text x="100" y="392" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Back</text>
    </svg>
  );
};

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  weekly: '7 Days',
  monthly: '30 Days',
  yearly: '365 Days',
};

const TIER_THRESHOLD_LABELS: Record<TimeRange, { high: string; mid: string; low: string }> = {
  weekly:  { high: '≥ 2 days',   mid: '1 day',       low: '0 days' },
  monthly: { high: '≥ 6 days',   mid: '2–5 days',    low: '0–1 days' },
  yearly:  { high: '≥ 60 days',  mid: '24–59 days',  low: '0–23 days' },
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

      <div className="p-4 flex justify-center gap-2">
        <div className="w-1/2 max-w-[220px]">
          <FrontDiagram counts={counts} range={timeRange} />
        </div>
        <div className="w-1/2 max-w-[220px]">
          <BackDiagram counts={counts} range={timeRange} />
        </div>
      </div>

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
                  const color = getMuscleColor(count, timeRange);
                  return (
                    <button
                      key={muscle}
                      onClick={() => toggleMuscle(muscle)}
                      className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider border transition-all"
                      style={{
                        borderColor: color,
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
          <div className="flex flex-wrap gap-3">
            {([
              { tier: 'high' as Tier, label: 'High' },
              { tier: 'mid' as Tier, label: 'Mid' },
              { tier: 'low' as Tier, label: 'Low' },
            ]).map(item => (
              <div key={item.tier} className="flex items-center gap-1.5" title={TIER_THRESHOLD_LABELS[timeRange][item.tier]}>
                <div className="w-2.5 h-2.5" style={{ backgroundColor: TIER_COLORS[item.tier], boxShadow: `0 0 6px ${TIER_COLORS[item.tier]}` }} />
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  {item.label} ({TIER_THRESHOLD_LABELS[timeRange][item.tier]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
