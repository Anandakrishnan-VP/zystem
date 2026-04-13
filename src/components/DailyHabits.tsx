import { useState } from 'react';
import { Plus, X, Check, Pencil } from 'lucide-react';
import type { Habit } from '@/hooks/useHabitData';
import { getTodayDate, getDayOfWeek } from '@/hooks/useHabitData';

interface DailyHabitsProps {
  habitCompletions: Record<string, Record<string, boolean>>;
  habitList: Habit[];
  onToggle: (habitId: string, date: string) => void;
  onAddHabit: (name: string, dayOfWeek: string) => void;
  onEditHabit: (id: string, newName: string) => void;
  onDeleteHabit: (id: string) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get the date string for a specific day of the current week
const getDateForDay = (dayName: string): string => {
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 = Sun, 1 = Mon, etc.
  const targetDayIndex = DAYS.indexOf(dayName) + 1; // 1 = Mon, 2 = Tue, etc. (Sun = 7)
  const adjustedTargetIndex = dayName === 'Sun' ? 0 : targetDayIndex;
  
  const diff = adjustedTargetIndex - currentDayIndex;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  
  return targetDate.toISOString().split('T')[0];
};

export const DailyHabits = ({
  habitCompletions,
  habitList,
  onToggle,
  onAddHabit,
  onEditHabit,
  onDeleteHabit
}: DailyHabitsProps) => {
  const today = getTodayDate();
  const todayDayName = getDayOfWeek(today);
  
  const [expandedDay, setExpandedDay] = useState<string | null>(todayDayName);
  const [newHabitName, setNewHabitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Persistent model: Add habit globally (not day-specific)
  const handleAddHabit = () => {
    const name = newHabitName.trim();
    if (name) {
      onAddHabit(name, ''); // Empty string = global habit
      setNewHabitName('');
    }
  };

  const handleStartEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setEditingName(habit.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onEditHabit(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <section className="mb-16">
      <h2 className="section-title">Daily Habit Tracker</h2>
      
      {/* Add New Habit - Global section */}
      <div className="mb-6 p-4 border border-foreground">
        <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">
          Add a habit (tracked every day)
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddHabit();
            }}
            placeholder="Enter habit name..."
            className="bg-background border border-foreground px-3 py-2 font-mono text-sm flex-1"
          />
          <button
            onClick={handleAddHabit}
            disabled={!newHabitName.trim()}
            className="p-2 border border-foreground hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Add habit"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of the week with all habits */}
      <div className="space-y-4">
        {DAYS.map(day => {
          const isExpanded = expandedDay === day;
          const dateForDay = getDateForDay(day);
          const isToday = dateForDay === today;
          const isFuture = new Date(dateForDay) > new Date(today);
          const isPast = dateForDay < today;
          
          // Count completions for ALL habits on this date
          const completedCount = habitList.filter(h => habitCompletions[h.id]?.[dateForDay]).length;
          const totalHabits = habitList.length;
          
          return (
            <div key={day} className={`border border-foreground ${isToday ? 'ring-2 ring-foreground' : ''}`}>
              {/* Day Header */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold uppercase tracking-wider">
                    {day}
                  </span>
                  {isToday && (
                    <span className="font-mono text-xs px-2 py-0.5 bg-foreground text-background">
                      TODAY
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {dateForDay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!isFuture && totalHabits > 0 && (
                    <span 
                      className="font-mono text-xs px-2 py-0.5"
                      style={{ 
                        backgroundColor: completedCount >= totalHabits * 0.5 
                          ? 'hsl(var(--status-success))' 
                          : 'hsl(var(--status-danger))',
                        color: 'white'
                      }}
                    >
                      {completedCount}/{totalHabits}
                    </span>
                  )}
                  {isFuture && (
                    <span className="font-mono text-xs text-muted-foreground">
                      Future
                    </span>
                  )}
                  {totalHabits === 0 && (
                    <span className="font-mono text-xs text-muted-foreground">
                      No habits
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded Content - Show ALL habits */}
              {isExpanded && (
                <div className="border-t border-foreground px-4 py-3">
                  {habitList.length > 0 ? (
                    <ul className="space-y-2">
                      {habitList.map(habit => {
                        const isChecked = habitCompletions[habit.id]?.[dateForDay] || false;
                        const isEditing = editingId === habit.id;

                        return (
                          <li key={habit.id} className="flex items-center gap-3">
                            <button
                              onClick={() => !isFuture && onToggle(habit.id, dateForDay)}
                              disabled={isFuture}
                              className={`habit-checkbox flex-shrink-0 ${isChecked ? 'checked' : ''} ${isFuture ? 'opacity-50 cursor-not-allowed' : ''}`}
                              aria-label={`${habit.name}${isChecked ? ' - completed' : ' - missed'}${isFuture ? ' (future)' : ''}`}
                            />
                            
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="bg-background border border-foreground px-2 py-1 font-mono text-sm flex-1"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSaveEdit}
                                  className="p-1 border border-foreground hover:bg-foreground hover:text-background"
                                  aria-label="Save"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className={`font-mono text-sm flex-1 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                  {habit.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleStartEdit(habit)}
                                    className="p-1 border border-foreground hover:bg-foreground hover:text-background"
                                    aria-label={`Edit ${habit.name}`}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteHabit(habit.id)}
                                    className="p-1 border border-foreground hover:bg-foreground hover:text-background"
                                    aria-label={`Delete ${habit.name}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="font-mono text-xs text-muted-foreground">
                      No habits yet. Add one above to start tracking.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
