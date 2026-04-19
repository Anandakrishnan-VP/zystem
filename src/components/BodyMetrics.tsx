import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  useBodyMetrics,
  calculateBMI,
  calculateBodyFat,
  getBMICategory,
  getBodyFatCategory,
} from '@/hooks/useBodyMetrics';
import { useMuscleTraining } from '@/hooks/useMuscleTraining';
import { Body3D } from './Body3D';

// Legacy 2D figure (kept as fallback)
const HumanFigure = ({ bmi, bodyFat, sex }: { bmi: number | null; bodyFat: number | null; sex: 'male' | 'female' }) => {
  // Scale factor based on BMI (18.5-35 range mapped to 0.7-1.4)
  const scale = bmi ? Math.min(1.4, Math.max(0.7, (bmi - 10) / 18)) : 1;
  
  // Torso width based on body fat
  const torsoScale = bodyFat !== null ? Math.min(1.5, Math.max(0.75, bodyFat / 20)) : scale;
  
  const bmiCat = bmi ? getBMICategory(bmi) : null;
  const accentColor = bmiCat?.color || 'hsl(var(--foreground))';
  
  return (
    <svg viewBox="0 0 120 240" className="w-full h-full max-h-[280px]" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="60" cy="30" r="16" fill="none" stroke={accentColor} strokeWidth="2" />
      
      {/* Neck */}
      <line x1="60" y1="46" x2="60" y2="56" stroke={accentColor} strokeWidth="2" />
      
      {/* Shoulders */}
      <line x1={60 - 28 * torsoScale} y1="60" x2={60 + 28 * torsoScale} y2="60" stroke={accentColor} strokeWidth="2" />
      
      {/* Torso - trapezoid shape */}
      <polygon
        points={`
          ${60 - 28 * torsoScale},60
          ${60 + 28 * torsoScale},60
          ${60 + 22 * torsoScale},130
          ${60 - 22 * torsoScale},130
        `}
        fill={accentColor}
        fillOpacity="0.15"
        stroke={accentColor}
        strokeWidth="2"
      />
      
      {/* Waist line */}
      <line
        x1={60 - 18 * torsoScale} y1="100"
        x2={60 + 18 * torsoScale} y2="100"
        stroke={accentColor} strokeWidth="1" strokeDasharray="4 2" opacity="0.5"
      />
      
      {/* Arms */}
      <line x1={60 - 28 * torsoScale} y1="60" x2={60 - 34 * scale} y2="120" stroke={accentColor} strokeWidth="2" />
      <line x1={60 + 28 * torsoScale} y1="60" x2={60 + 34 * scale} y2="120" stroke={accentColor} strokeWidth="2" />
      
      {/* Hands */}
      <circle cx={60 - 34 * scale} cy="122" r="4" fill="none" stroke={accentColor} strokeWidth="1.5" />
      <circle cx={60 + 34 * scale} cy="122" r="4" fill="none" stroke={accentColor} strokeWidth="1.5" />
      
      {/* Pelvis */}
      <polygon
        points={`
          ${60 - 22 * torsoScale},130
          ${60 + 22 * torsoScale},130
          ${60 + 14 * scale},145
          ${60 - 14 * scale},145
        `}
        fill={accentColor}
        fillOpacity="0.1"
        stroke={accentColor}
        strokeWidth="2"
      />
      
      {/* Legs */}
      <line x1={60 - 12 * scale} y1="145" x2={60 - 14 * scale} y2="210" stroke={accentColor} strokeWidth="2" />
      <line x1={60 + 12 * scale} y1="145" x2={60 + 14 * scale} y2="210" stroke={accentColor} strokeWidth="2" />
      
      {/* Feet */}
      <line x1={60 - 14 * scale} y1="210" x2={60 - 22 * scale} y2="215" stroke={accentColor} strokeWidth="2" />
      <line x1={60 + 14 * scale} y1="210" x2={60 + 22 * scale} y2="215" stroke={accentColor} strokeWidth="2" />
      
      {/* Joint dots */}
      {[
        [60 - 28 * torsoScale, 60], [60 + 28 * torsoScale, 60], // shoulders
        [60 - 22 * torsoScale, 130], [60 + 22 * torsoScale, 130], // waist
        [60 - 12 * scale, 145], [60 + 12 * scale, 145], // hips
        [60 - 14 * scale, 175], [60 + 14 * scale, 175], // knees
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill={accentColor} opacity="0.6" />
      ))}
    </svg>
  );
};

export const BodyMetricsPanel = () => {
  const { metrics, loading, saveMetrics } = useBodyMetrics();
  const { getMuscleCounts, isTodayTrained } = useMuscleTraining();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    height_cm: '',
    weight_kg: '',
    age: '',
    sex: 'male' as 'male' | 'female',
    waist_cm: '',
    neck_cm: '',
    hip_cm: '',
  });

  useEffect(() => {
    if (metrics) {
      setForm({
        height_cm: String(metrics.height_cm),
        weight_kg: String(metrics.weight_kg),
        age: String(metrics.age),
        sex: metrics.sex,
        waist_cm: metrics.waist_cm ? String(metrics.waist_cm) : '',
        neck_cm: metrics.neck_cm ? String(metrics.neck_cm) : '',
        hip_cm: metrics.hip_cm ? String(metrics.hip_cm) : '',
      });
    }
  }, [metrics]);

  const handleSave = async () => {
    const h = parseFloat(form.height_cm);
    const w = parseFloat(form.weight_kg);
    const a = parseInt(form.age);
    if (!h || !w || !a || h <= 0 || w <= 0 || a <= 0) return;

    await saveMetrics({
      height_cm: h,
      weight_kg: w,
      age: a,
      sex: form.sex,
      waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null,
      neck_cm: form.neck_cm ? parseFloat(form.neck_cm) : null,
      hip_cm: form.hip_cm ? parseFloat(form.hip_cm) : null,
    });
    setIsEditing(false);
  };

  const bmi = metrics ? calculateBMI(metrics.weight_kg, metrics.height_cm) : null;
  const bodyFat = metrics && metrics.waist_cm && metrics.neck_cm
    ? calculateBodyFat(metrics.sex, metrics.waist_cm, metrics.neck_cm, metrics.height_cm, metrics.hip_cm || undefined)
    : null;

  const bmiCat = bmi ? getBMICategory(bmi) : null;
  const bfCat = bodyFat !== null && metrics ? getBodyFatCategory(bodyFat, metrics.sex) : null;

  if (loading) {
    return (
      <div className="border border-foreground p-4">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Loading metrics...</p>
      </div>
    );
  }

  const showForm = !metrics || isEditing;

  return (
    <div className="border border-foreground">
      <div className="px-4 py-3 border-b border-foreground flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest">Body Metrics</h3>
        {metrics && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
        )}
      </div>

      {showForm ? (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Height (cm)" value={form.height_cm} onChange={v => setForm(f => ({ ...f, height_cm: v }))} />
            <InputField label="Weight (kg)" value={form.weight_kg} onChange={v => setForm(f => ({ ...f, weight_kg: v }))} />
            <InputField label="Age" value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} />
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sex</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, sex: s }))}
                    className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                      form.sex === s
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-muted-foreground/30 text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground pt-2">
            For Body Fat (US Navy Method)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Waist (cm)" value={form.waist_cm} onChange={v => setForm(f => ({ ...f, waist_cm: v }))} />
            <InputField label="Neck (cm)" value={form.neck_cm} onChange={v => setForm(f => ({ ...f, neck_cm: v }))} />
            {form.sex === 'female' && (
              <InputField label="Hip (cm)" value={form.hip_cm} onChange={v => setForm(f => ({ ...f, hip_cm: v }))} />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!form.height_cm || !form.weight_kg || !form.age}
              className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-wider border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              <Save size={12} /> Save
            </button>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider border border-muted-foreground/30 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex gap-6">
            {/* Human figure */}
            <div className="w-28 flex-shrink-0">
              <HumanFigure bmi={bmi} bodyFat={bodyFat} sex={metrics.sex} />
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <StatRow label="Height" value={`${metrics.height_cm} cm`} />
                <StatRow label="Weight" value={`${metrics.weight_kg} kg`} />
                <StatRow label="Age" value={`${metrics.age}`} />
                <StatRow label="Sex" value={metrics.sex} />
              </div>

              {/* BMI */}
              {bmi !== null && bmiCat && (
                <div className="border-t border-muted-foreground/20 pt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold" style={{ color: bmiCat.color }}>
                      {bmi.toFixed(1)}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">BMI</span>
                  </div>
                  <span
                    className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 inline-block mt-1"
                    style={{ backgroundColor: bmiCat.color, color: '#000' }}
                  >
                    {bmiCat.label}
                  </span>
                </div>
              )}

              {/* Body Fat */}
              {bodyFat !== null && bfCat && (
                <div className="border-t border-muted-foreground/20 pt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold" style={{ color: bfCat.color }}>
                      {bodyFat.toFixed(1)}%
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Body Fat</span>
                  </div>
                  <span
                    className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 inline-block mt-1"
                    style={{ backgroundColor: bfCat.color, color: '#000' }}
                  >
                    {bfCat.label}
                  </span>
                </div>
              )}

              {!metrics.waist_cm && (
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Add waist & neck measurements to see body fat %
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-background border border-foreground px-2 py-1.5 font-mono text-sm"
      min="0"
      step="0.1"
    />
  </div>
);

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}: </span>
    <span className="font-mono text-xs font-bold uppercase">{value}</span>
  </div>
);
