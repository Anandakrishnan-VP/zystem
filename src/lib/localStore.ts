export const GUEST_ID = 'local-guest';
export const GUEST_MODE_KEY = 'zystem_guest_mode';

export const localKeys = {
  profile: 'zystem_local_profile',
  habitData: 'zystem_local_habit_data',
  water: (date: string) => `zystem_local_water_${date}`,
  notes: 'zystem_local_notes',
  library: 'zystem_local_library',
  bodyMetrics: 'zystem_local_body_metrics',
  muscleTraining: 'zystem_local_muscle_training',
  countdown: 'zystem_local_countdown',
  streakRevivals: 'zystem_local_streak_revivals',
};

export const readLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeLocal = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage may be full or blocked.
  }
};

export const createLocalId = (prefix = 'local') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const hasGuestData = () => {
  if (typeof window === 'undefined') return false;
  return Object.values(localKeys).some((entry) => {
    if (typeof entry === 'function') return false;
    return localStorage.getItem(entry) !== null;
  });
};