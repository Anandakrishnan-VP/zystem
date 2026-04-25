import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/hooks/useGuestMode';
import { localKeys, readLocal, writeLocal } from '@/lib/localStore';

export interface MuscleTrainingEntry {
  muscle_group: string;
  trained_date: string;
}

export const MUSCLE_GROUPS = [
  'chest', 'upper_back', 'lower_back', 'shoulders',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'glutes', 'quads', 'hamstrings', 'calves',
  'traps', 'neck',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export type TimeRange = 'weekly' | 'monthly' | 'yearly';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  traps: 'Traps',
  neck: 'Neck',
};

const getDaysForRange = (range: TimeRange): number => {
  switch (range) {
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'yearly': return 365;
  }
};

export function useMuscleTraining() {
  const { user } = useAuth();
  const { isGuest, refreshLocalData } = useGuestMode();
  const [training, setTraining] = useState<MuscleTrainingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');

  const today = new Date().toISOString().split('T')[0];

  const fetchTraining = useCallback(async () => {
    if (isGuest) {
      const all = readLocal<MuscleTrainingEntry[]>(localKeys.muscleTraining, []);
      const daysBack = getDaysForRange(timeRange);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysBack);
      const fromStr = fromDate.toISOString().split('T')[0];
      setTraining(all.filter(t => t.trained_date >= fromStr));
      setLoading(false);
      return;
    }
    if (!user) return;
    const daysBack = getDaysForRange(timeRange);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    const fromStr = fromDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('muscle_training')
      .select('muscle_group, trained_date')
      .eq('user_id', user.id)
      .gte('trained_date', fromStr);

    if (!error && data) {
      setTraining(data);
    }
    setLoading(false);
  }, [user, timeRange, isGuest]);

  useEffect(() => { fetchTraining(); }, [fetchTraining]);

  const toggleMuscle = async (muscle: MuscleGroup) => {
    if (isGuest) {
      const all = readLocal<MuscleTrainingEntry[]>(localKeys.muscleTraining, []);
      const existing = all.find(t => t.muscle_group === muscle && t.trained_date === today);
      const next = existing ? all.filter(t => !(t.muscle_group === muscle && t.trained_date === today)) : [...all, { muscle_group: muscle, trained_date: today }];
      writeLocal(localKeys.muscleTraining, next);
      refreshLocalData();
      fetchTraining();
      return;
    }
    if (!user) return;

    const existing = training.find(
      t => t.muscle_group === muscle && t.trained_date === today
    );

    if (existing) {
      await supabase
        .from('muscle_training')
        .delete()
        .eq('user_id', user.id)
        .eq('muscle_group', muscle)
        .eq('trained_date', today);
      setTraining(prev => prev.filter(
        t => !(t.muscle_group === muscle && t.trained_date === today)
      ));
    } else {
      await supabase
        .from('muscle_training')
        .insert({ user_id: user.id, muscle_group: muscle, trained_date: today });
      setTraining(prev => [...prev, { muscle_group: muscle, trained_date: today }]);
    }
  };

  const getMuscleCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const mg of MUSCLE_GROUPS) counts[mg] = 0;
    for (const t of training) {
      counts[t.muscle_group] = (counts[t.muscle_group] || 0) + 1;
    }
    return counts;
  };

  const isTodayTrained = (muscle: MuscleGroup): boolean => {
    return training.some(t => t.muscle_group === muscle && t.trained_date === today);
  };

  return { training, loading, toggleMuscle, getMuscleCounts, isTodayTrained, today, timeRange, setTimeRange };
}
