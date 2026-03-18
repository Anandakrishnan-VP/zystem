import { getDaysInMonth, getMonthName, getDayOfWeek } from '@/lib/dateUtils';
import type { Habit } from '@/hooks/useHabitData';

interface YearCalendarProps {
  year: number;
  habitCompletions: Record<string, Record<string, boolean>>;
  habitList: Habit[];
}

const safeHabitList = (list: Habit[] | undefined): Habit[] => list ?? [];

const getDateString = (year: number, month: number, day: number): string => {
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const calculateDayCompletion = (
  year: number,
  month: number,
  day: number,
  habitCompletions: Record<string, Record<string, boolean>>,
  habitList: Habit[]
): number => {
  const habits = safeHabitList(habitList);
  if (habits.length === 0) return -1;

  const dateStr = getDateString(year, month, day);
  let completed = 0;
  habits.forEach(habit => {
    if (habitCompletions[habit.id]?.[dateStr]) {
      completed++;
    }
  });

  return completed / habits.length;
};

const isDatePastOrToday = (year: number, month: number, day: number): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(year, month, day);
  return checkDate <= today;
};

// Get completion level 0-4 for GitHub-style coloring
const getCompletionLevel = (completion: number): number => {
  if (completion < 0) return 0; // no habits
  if (completion === 0) return 0;
  if (completion < 0.34) return 1;
  if (completion < 0.67) return 2;
  if (completion < 1) return 3;
  return 4; // 100%
};

// Build all days of the year as a flat grid of weeks (columns) like GitHub
const buildContributionGrid = (
  year: number,
  habitCompletions: Record<string, Record<string, boolean>>,
  habitList: Habit[]
) => {
  const habits = safeHabitList(habitList);
  
  // Start from Jan 1
  const startDate = new Date(year, 0, 1);
  const startDow = startDate.getDay(); // 0=Sun
  // GitHub grid: columns = weeks, rows = days (Sun-Sat)
  
  const endDate = new Date(year, 11, 31);
  
  // Grid: 7 rows x N columns
  const weeks: Array<Array<{ date: Date | null; level: number; dateStr: string } | null>> = [];
  
  // Fill initial empty cells for the first week
  let currentWeek: Array<{ date: Date | null; level: number; dateStr: string } | null> = [];
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }
  
  const current = new Date(startDate);
  while (current <= endDate) {
    const month = current.getMonth();
    const day = current.getDate();
    const dow = current.getDay();
    
    const isPast = isDatePastOrToday(year, month, day);
    let level = 0;
    if (isPast && habits.length > 0) {
      const completion = calculateDayCompletion(year, month, day, habitCompletions, habits);
      level = getCompletionLevel(completion);
    }
    
    currentWeek.push({
      date: new Date(current),
      level,
      dateStr: getDateString(year, month, day),
    });
    
    if (dow === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  // Push remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};

// Calculate month label positions
const getMonthLabels = (year: number) => {
  const labels: Array<{ name: string; weekIndex: number }> = [];
  
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const startOfYear = new Date(year, 0, 1);
    const startDow = startOfYear.getDay();
    const dayOfYear = Math.floor((firstDay.getTime() - startOfYear.getTime()) / 86400000);
    const weekIndex = Math.floor((dayOfYear + startDow) / 7);
    labels.push({ name: getMonthName(m), weekIndex });
  }
  
  return labels;
};

export const YearCalendar = ({ year, habitCompletions, habitList }: YearCalendarProps) => {
  const weeks = buildContributionGrid(year, habitCompletions, habitList);
  const monthLabels = getMonthLabels(year);
  const dayLabels = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

  return (
    <section className="mb-16">
      <h2 className="section-title">Year {year}</h2>
      
      <div className="contribution-graph">
        {/* Month labels */}
        <div className="flex ml-8">
          {monthLabels.map((label, i) => {
            const nextWeek = i < 11 ? monthLabels[i + 1].weekIndex : weeks.length;
            const span = nextWeek - label.weekIndex;
            return (
              <span
                key={label.name}
                className="font-mono text-[10px] text-muted-foreground"
                style={{
                  width: `${span * 14}px`,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {span >= 3 ? label.name : ''}
              </span>
            );
          })}
        </div>

        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1 justify-start">
            {dayLabels.map((label, i) => (
              <span
                key={i}
                className="font-mono text-[9px] text-muted-foreground h-[12px] flex items-center justify-end pr-1"
                style={{ width: '28px' }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`contrib-cell contrib-level-${cell ? cell.level : 'empty'}`}
                    title={cell?.date ? `${cell.dateStr}: Level ${cell.level}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-3 ml-8">
          <span className="font-mono text-[9px] text-muted-foreground mr-1">Less</span>
          <div className="contrib-cell contrib-level-0" />
          <div className="contrib-cell contrib-level-1" />
          <div className="contrib-cell contrib-level-2" />
          <div className="contrib-cell contrib-level-3" />
          <div className="contrib-cell contrib-level-4" />
          <span className="font-mono text-[9px] text-muted-foreground ml-1">More</span>
        </div>
      </div>
    </section>
  );
};
