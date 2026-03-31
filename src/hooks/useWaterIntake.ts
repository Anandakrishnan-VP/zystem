import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WaterIntake {
  id: string;
  bottles_drunk: number;
  target_bottles: number;
  intake_date: string;
}

export function useWaterIntake() {
  const { user } = useAuth();
  const [data, setData] = useState<WaterIntake | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchToday = useCallback(async () => {
    if (!user) return;
    const { data: row } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', user.id)
      .eq('intake_date', today)
      .maybeSingle();
    setData(row);
    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const toggleBottle = useCallback(async (bottleIndex: number) => {
    if (!user) return;
    const currentDrunk = data?.bottles_drunk ?? 0;
    const newDrunk = bottleIndex + 1 <= currentDrunk ? bottleIndex : bottleIndex + 1;

    if (data) {
      await supabase
        .from('water_intake')
        .update({ bottles_drunk: newDrunk, updated_at: new Date().toISOString() })
        .eq('id', data.id);
    } else {
      await supabase
        .from('water_intake')
        .insert({ user_id: user.id, intake_date: today, bottles_drunk: newDrunk, target_bottles: 8 });
    }
    fetchToday();
  }, [user, data, today, fetchToday]);

  const setTarget = useCallback(async (target: number) => {
    if (!user) return;
    if (data) {
      await supabase
        .from('water_intake')
        .update({ target_bottles: target, updated_at: new Date().toISOString() })
        .eq('id', data.id);
    } else {
      await supabase
        .from('water_intake')
        .insert({ user_id: user.id, intake_date: today, bottles_drunk: 0, target_bottles: target });
    }
    fetchToday();
  }, [user, data, today, fetchToday]);

  return {
    bottlesDrunk: data?.bottles_drunk ?? 0,
    targetBottles: data?.target_bottles ?? 8,
    loading,
    toggleBottle,
    setTarget,
  };
}
