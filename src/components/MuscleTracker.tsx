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

// Front-view muscle body SVG
const FrontDiagram = ({ counts, maxCount }: {
  counts: Record<string, number>;
  maxCount: number;
}) => {
  const mc = (m: MuscleGroup) => getHeatColor(counts[m] || 0, maxCount);
  const mo = (m: MuscleGroup) => getFillOpacity(counts[m] || 0);

  return (
    <svg viewBox="0 0 200 400" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="32" rx="18" ry="22" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.4" />
      <rect x="92" y="52" width="16" height="14" rx="3" fill={mc('neck')} fillOpacity={mo('neck')} stroke={mc('neck')} strokeWidth="1" />
      <polygon points="76,66 92,58 92,72 76,76" fill={mc('traps')} fillOpacity={mo('traps')} stroke={mc('traps')} strokeWidth="1" />
      <polygon points="124,66 108,58 108,72 124,76" fill={mc('traps')} fillOpacity={mo('traps')} stroke={mc('traps')} strokeWidth="1" />
      <ellipse cx="68" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="1.5" />
      <ellipse cx="132" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="1.5" />
      <path d="M 78,78 Q 100,72 122,78 L 118,108 Q 100,114 82,108 Z" fill={mc('chest')} fillOpacity={mo('chest')} stroke={mc('chest')} strokeWidth="1.5" />
      <ellipse cx="58" cy="110" rx="8" ry="20" fill={mc('biceps')} fillOpacity={mo('biceps')} stroke={mc('biceps')} strokeWidth="1.5" transform="rotate(-10 58 110)" />
      <ellipse cx="142" cy="110" rx="8" ry="20" fill={mc('biceps')} fillOpacity={mo('biceps')} stroke={mc('biceps')} strokeWidth="1.5" transform="rotate(10 142 110)" />
      <ellipse cx="48" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="1" transform="rotate(-5 48 150)" />
      <ellipse cx="152" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="1" transform="rotate(5 152 150)" />
      <rect x="88" y="110" width="24" height="50" rx="4" fill={mc('abs')} fillOpacity={mo('abs')} stroke={mc('abs')} strokeWidth="1.5" />
      {[122, 134, 146].map(y => (<line key={y} x1="90" y1={y} x2="110" y2={y} stroke={mc('abs')} strokeWidth="0.8" opacity="0.5" />))}
      <polygon points="82,110 88,110 86,160 78,156" fill={mc('obliques')} fillOpacity={mo('obliques')} stroke={mc('obliques')} strokeWidth="1" />
      <polygon points="118,110 112,110 114,160 122,156" fill={mc('obliques')} fillOpacity={mo('obliques')} stroke={mc('obliques')} strokeWidth="1" />
      <ellipse cx="84" cy="225" rx="14" ry="38" fill={mc('quads')} fillOpacity={mo('quads')} stroke={mc('quads')} strokeWidth="1.5" />
      <ellipse cx="116" cy="225" rx="14" ry="38" fill={mc('quads')} fillOpacity={mo('quads')} stroke={mc('quads')} strokeWidth="1.5" />
      <ellipse cx="82" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="1.5" />
      <ellipse cx="118" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="1.5" />
      <ellipse cx="80" cy="340" rx="10" ry="6" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      <ellipse cx="120" cy="340" rx="10" ry="6" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      <ellipse cx="44" cy="176" rx="6" ry="8" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      <ellipse cx="156" cy="176" rx="6" ry="8" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      <text x="100" y="390" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Front</text>
    </svg>
  );
};

// Back-view muscle body SVG
const BackDiagram = ({ counts, maxCount }: {
  counts: Record<string, number>;
  maxCount: number;
}) => {
  const mc = (m: MuscleGroup) => getHeatColor(counts[m] || 0, maxCount);
  const mo = (m: MuscleGroup) => getFillOpacity(counts[m] || 0);

  return (
    <svg viewBox="0 0 200 400" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="32" rx="18" ry="22" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.4" />
      <rect x="92" y="52" width="16" height="14" rx="3" fill={mc('neck')} fillOpacity={mo('neck')} stroke={mc('neck')} strokeWidth="1" />
      {/* Traps - larger on back view */}
      <path d="M 76,66 L 92,58 L 100,62 L 108,58 L 124,66 L 120,82 Q 100,88 80,82 Z" fill={mc('traps')} fillOpacity={mo('traps')} stroke={mc('traps')} strokeWidth="1.5" />
      {/* Rear delts */}
      <ellipse cx="68" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="1.5" />
      <ellipse cx="132" cy="82" rx="14" ry="10" fill={mc('shoulders')} fillOpacity={mo('shoulders')} stroke={mc('shoulders')} strokeWidth="1.5" />
      {/* Upper back / lats */}
      <path d="M 80,82 Q 100,78 120,82 L 122,120 Q 100,126 78,120 Z" fill={mc('upper_back')} fillOpacity={mo('upper_back')} stroke={mc('upper_back')} strokeWidth="1.5" />
      {/* Triceps */}
      <ellipse cx="55" cy="110" rx="9" ry="20" fill={mc('triceps')} fillOpacity={mo('triceps')} stroke={mc('triceps')} strokeWidth="1.5" transform="rotate(-10 55 110)" />
      <ellipse cx="145" cy="110" rx="9" ry="20" fill={mc('triceps')} fillOpacity={mo('triceps')} stroke={mc('triceps')} strokeWidth="1.5" transform="rotate(10 145 110)" />
      {/* Forearms */}
      <ellipse cx="48" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="1" transform="rotate(-5 48 150)" />
      <ellipse cx="152" cy="150" rx="6" ry="22" fill={mc('forearms')} fillOpacity={mo('forearms')} stroke={mc('forearms')} strokeWidth="1" transform="rotate(5 152 150)" />
      {/* Lower back */}
      <rect x="84" y="122" width="32" height="30" rx="5" fill={mc('lower_back')} fillOpacity={mo('lower_back')} stroke={mc('lower_back')} strokeWidth="1.5" />
      {/* Spine line */}
      <line x1="100" y1="82" x2="100" y2="155" stroke="hsl(var(--foreground))" strokeWidth="0.6" opacity="0.3" />
      {/* Glutes */}
      <ellipse cx="88" cy="172" rx="16" ry="14" fill={mc('glutes')} fillOpacity={mo('glutes')} stroke={mc('glutes')} strokeWidth="1.5" />
      <ellipse cx="112" cy="172" rx="16" ry="14" fill={mc('glutes')} fillOpacity={mo('glutes')} stroke={mc('glutes')} strokeWidth="1.5" />
      {/* Hamstrings */}
      <ellipse cx="84" cy="228" rx="14" ry="38" fill={mc('hamstrings')} fillOpacity={mo('hamstrings')} stroke={mc('hamstrings')} strokeWidth="1.5" />
      <ellipse cx="116" cy="228" rx="14" ry="38" fill={mc('hamstrings')} fillOpacity={mo('hamstrings')} stroke={mc('hamstrings')} strokeWidth="1.5" />
      {/* Calves */}
      <ellipse cx="82" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="1.5" />
      <ellipse cx="118" cy="305" rx="10" ry="28" fill={mc('calves')} fillOpacity={mo('calves')} stroke={mc('calves')} strokeWidth="1.5" />
      {/* Feet */}
      <ellipse cx="80" cy="340" rx="10" ry="6" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      <ellipse cx="120" cy="340" rx="10" ry="6" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      {/* Hands */}
      <ellipse cx="44" cy="176" rx="6" ry="8" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      <ellipse cx="156" cy="176" rx="6" ry="8" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.3" />
      <text x="100" y="390" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Back</text>
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
  const { metrics } = useBodyMetrics();
  const sex: 'male' | 'female' = metrics?.sex ?? 'male';
  const bmi = metrics ? calculateBMI(metrics.weight_kg, metrics.height_cm) : null;
  const bodyFat = metrics && metrics.waist_cm && metrics.neck_cm
    ? calculateBodyFat(metrics.sex, metrics.waist_cm, metrics.neck_cm, metrics.height_cm, metrics.hip_cm || undefined)
    : null;

  if (loading) {
    return (
      <div className="border border-foreground p-4">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Loading muscle tracker...</p>
      </div>
    );
  }

  const counts = getMuscleCounts();
  const maxCount = Math.max(...Object.values(counts), 1);

  // Group muscles for the checklist
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

      {/* 3D realistic body + Front/Back SVGs */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-1 h-[420px] bg-muted/20 border border-foreground/10 rounded-sm overflow-hidden">
          <MuscleBody3D
            sex={sex}
            bmi={bmi}
            bodyFat={bodyFat}
            muscleCounts={counts}
            maxCount={maxCount}
            isTodayTrained={isTodayTrained}
          />
        </div>
        <div className="lg:col-span-2 flex justify-center gap-2">
          <div className="w-1/2 max-w-[220px]">
            <FrontDiagram counts={counts} maxCount={maxCount} />
          </div>
          <div className="w-1/2 max-w-[220px]">
            <BackDiagram counts={counts} maxCount={maxCount} />
          </div>
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
