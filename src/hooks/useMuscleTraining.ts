import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export function useMuscleTraining() {
  const { user } = useAuth();
  const [training, setTraining] = useState<MuscleTrainingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  // Fetch last 7 days of training
  const fetchTraining = useCallback(async () => {
    if (!user) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('muscle_training')
      .select('muscle_group, trained_date')
      .eq('user_id', user.id)
      .gte('trained_date', fromDate);

    if (!error && data) {
      setTraining(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTraining(); }, [fetchTraining]);

  const toggleMuscle = async (muscle: MuscleGroup) => {
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

  // Count training sessions per muscle in last 7 days
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

  return { training, loading, toggleMuscle, getMuscleCounts, isTodayTrained, today };
}
