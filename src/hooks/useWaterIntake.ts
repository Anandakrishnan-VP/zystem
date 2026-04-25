import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/hooks/useGuestMode';
import { createLocalId, localKeys, readLocal, writeLocal } from '@/lib/localStore';

interface WaterIntake {
  id: string;
  bottles_drunk: number;
  target_bottles: number;
  intake_date: string;
}

export function useWaterIntake() {
  const { user } = useAuth();
  const { isGuest, refreshLocalData } = useGuestMode();
  const [data, setData] = useState<WaterIntake | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchToday = useCallback(async () => {
    if (isGuest) {
      setData(readLocal<WaterIntake | null>(localKeys.water(today), null));
      setLoading(false);
      return;
    }
    if (!user) return;
    const { data: row } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', user.id)
      .eq('intake_date', today)
      .maybeSingle();
    setData(row);
    setLoading(false);
  }, [user, today, isGuest]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const toggleBottle = useCallback(async (bottleIndex: number) => {
    if (isGuest) {
      const currentDrunk = data?.bottles_drunk ?? 0;
      const next: WaterIntake = {
        id: data?.id || createLocalId('water'),
        intake_date: today,
        target_bottles: data?.target_bottles ?? 8,
        bottles_drunk: bottleIndex + 1 <= currentDrunk ? bottleIndex : bottleIndex + 1,
      };
      setData(next);
      writeLocal(localKeys.water(today), next);
      refreshLocalData();
      return;
    }
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
  }, [user, data, today, fetchToday, isGuest, refreshLocalData]);

  const setTarget = useCallback(async (target: number) => {
    if (isGuest) {
      const next: WaterIntake = { id: data?.id || createLocalId('water'), intake_date: today, bottles_drunk: data?.bottles_drunk ?? 0, target_bottles: target };
      setData(next);
      writeLocal(localKeys.water(today), next);
      refreshLocalData();
      return;
    }
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
  }, [user, data, today, fetchToday, isGuest, refreshLocalData]);

  return {
    bottlesDrunk: data?.bottles_drunk ?? 0,
    targetBottles: data?.target_bottles ?? 8,
    loading,
    toggleBottle,
    setTarget,
  };
}
