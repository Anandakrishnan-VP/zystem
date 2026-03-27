import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

export const RealTimeClock = () => {
  const [now, setNow] = useState(new Date());
  const { target, loading: countdownLoading, saveTarget, clearTarget } = useCountdown();
  const [editing, setEditing] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempLabel, setTempLabel] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });

  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  const daysLeftInYear = Math.ceil((endOfYear.getTime() - now.getTime()) / 86400000);

  const getCountdown = () => {
    if (!target) return null;
    const targetDate = new Date(target.target_date + 'T23:59:59');
    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return { totalDays: 0, weeks: 0, remainingDays: 0, passed: true };
    const totalDays = Math.ceil(diffMs / 86400000);
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    return { totalDays, weeks, remainingDays, passed: false };
  };

  const countdown = getCountdown();

  const handleSave = async () => {
    if (tempDate) {
      await saveTarget(tempDate, tempLabel);
    }
    setEditing(false);
  };

  const handleClear = async () => {
    await clearTarget();
    setEditing(false);
  };

  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div className="text-left">
        <p className="font-mono text-2xl font-bold tracking-wider">
          {formatTime(now)}
        </p>
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground mt-1">
          {formatDate(now)}
        </p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-2">
          {daysLeftInYear} {daysLeftInYear === 1 ? 'day' : 'days'} left in {now.getFullYear()}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        {editing ? (
          <div className="flex flex-col items-end gap-1">
            <input
              type="text"
              placeholder="Label (optional)"
              value={tempLabel}
              onChange={e => setTempLabel(e.target.value)}
              className="font-mono text-[10px] bg-transparent border border-muted-foreground/30 px-2 py-0.5 w-32 text-right text-foreground placeholder:text-muted-foreground/40"
            />
            <input
              type="date"
              value={tempDate}
              onChange={e => setTempDate(e.target.value)}
              className="font-mono text-[10px] bg-transparent border border-muted-foreground/30 px-2 py-0.5 w-32 text-right text-foreground"
            />
            <div className="flex gap-1">
              <button onClick={handleSave} className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border border-foreground hover:bg-foreground hover:text-background">
                Set
              </button>
              {target && (
                <button onClick={handleClear} className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border border-muted-foreground/30 text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              )}
              <button onClick={() => setEditing(false)} className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
          </div>
        ) : countdown ? (
          <button
            onClick={() => { setTempDate(target?.target_date || ''); setTempLabel(target?.label || ''); setEditing(true); }}
            className="group cursor-pointer text-right"
          >
            {target?.label && (
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
                {target.label}
              </p>
            )}
            {countdown.passed ? (
              <p className="font-mono text-xs text-muted-foreground">Target reached</p>
            ) : (
              <>
                <p className="font-mono text-lg font-bold tracking-wider">
                  {countdown.totalDays}<span className="text-[10px] text-muted-foreground"> days</span>
                </p>
                {countdown.weeks > 0 && (
                  <p className="font-mono text-xs text-muted-foreground">
                    {countdown.weeks}<span className="text-[9px]">w </span>
                    {countdown.remainingDays}<span className="text-[9px]">d</span>
                  </p>
                )}
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 group-hover:text-muted-foreground">
                  click to edit
                </p>
              </>
            )}
          </button>
        ) : countdownLoading ? null : (
          <button
            onClick={() => { setTempDate(''); setTempLabel(''); setEditing(true); }}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <Target size={12} />
            Set countdown
          </button>
        )}
      </div>
    </div>
  );
};
