import { useState } from 'react';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import { Droplets, Minus, Plus } from 'lucide-react';

export function WaterIntakeTracker() {
  const { bottlesDrunk, targetBottles, loading, toggleBottle, setTarget } = useWaterIntake();
  const [showTargetEdit, setShowTargetEdit] = useState(false);

  if (loading) {
    return (
      <div className="border border-foreground p-4">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const progress = targetBottles > 0 ? Math.round((bottlesDrunk / targetBottles) * 100) : 0;

  return (
    <div className="border border-foreground p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-[hsl(200,90%,50%)]" />
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Water Intake</h3>
        </div>
        <button
          onClick={() => setShowTargetEdit(!showTargetEdit)}
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          Target: {targetBottles}L
        </button>
      </div>

      {/* Target editor */}
      {showTargetEdit && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-muted-foreground/20">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Daily Target:</span>
          <button
            onClick={() => targetBottles > 1 && setTarget(targetBottles - 1)}
            className="border border-foreground p-1 hover:bg-foreground hover:text-background transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="font-mono text-sm font-bold w-8 text-center">{targetBottles}</span>
          <button
            onClick={() => setTarget(targetBottles + 1)}
            className="border border-foreground p-1 hover:bg-foreground hover:text-background transition-colors"
          >
            <Plus size={12} />
          </button>
          <span className="font-mono text-xs text-muted-foreground">litres</span>
        </div>
      )}

      {/* Progress text */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          {bottlesDrunk}L / {targetBottles}L
        </span>
        <span className={`font-mono text-xs font-bold uppercase tracking-wider ${
          progress >= 100 ? 'text-[hsl(120,70%,45%)]' : 'text-[hsl(200,90%,50%)]'
        }`}>
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted mb-4">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: progress >= 100 ? 'hsl(120,70%,45%)' : 'hsl(200,90%,50%)',
          }}
        />
      </div>

      {/* Bottles grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-2 lg:gap-3">
        {Array.from({ length: targetBottles }).map((_, i) => {
          const isDrunk = i < bottlesDrunk;
          return (
            <button
              key={i}
              onClick={() => toggleBottle(i)}
              className={`relative flex flex-col items-center justify-center p-2 lg:p-3 border transition-all duration-300 group ${
                isDrunk
                  ? 'border-[hsl(200,90%,50%)] bg-[hsl(200,90%,50%)]/10'
                  : 'border-muted-foreground/30 hover:border-foreground'
              }`}
              title={`Bottle ${i + 1} — ${isDrunk ? 'Drunk' : 'Not yet'}`}
            >
              {/* Bottle SVG */}
              <svg
                viewBox="0 0 24 36"
                className={`w-5 h-8 lg:w-7 lg:h-10 transition-colors duration-300 ${
                  isDrunk ? 'text-[hsl(200,90%,50%)]' : 'text-muted-foreground/40 group-hover:text-muted-foreground'
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {/* Cap */}
                <rect x="8" y="0" width="8" height="4" rx="1" fill={isDrunk ? 'currentColor' : 'none'} />
                {/* Neck */}
                <path d="M9 4 L9 8 L6 12 L6 32 Q6 34 8 34 L16 34 Q18 34 18 32 L18 12 L15 8 L15 4" />
                {/* Water fill */}
                {isDrunk && (
                  <path
                    d="M7 14 L7 32 Q7 33 8 33 L16 33 Q17 33 17 32 L17 14 Z"
                    fill="currentColor"
                    opacity="0.6"
                  />
                )}
              </svg>
              <span className={`font-mono text-[10px] mt-1 uppercase tracking-wider ${
                isDrunk ? 'text-[hsl(200,90%,50%)]' : 'text-muted-foreground/50'
              }`}>
                1L
              </span>
            </button>
          );
        })}
      </div>

      {/* Completion message */}
      {progress >= 100 && (
        <div className="mt-4 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-[hsl(120,70%,45%)]">
            ✓ Daily goal reached!
          </p>
        </div>
      )}
    </div>
  );
}
