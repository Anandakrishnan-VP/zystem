import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/hooks/useGuestMode';
import { createLocalId, localKeys, readLocal, writeLocal } from '@/lib/localStore';

interface CountdownTarget {
  id: string;
  target_date: string;
  label: string;
}

export function useCountdown() {
  const { user } = useAuth();
  const { isGuest, refreshLocalData } = useGuestMode();
  const [target, setTarget] = useState<CountdownTarget | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTarget = useCallback(async () => {
    if (isGuest) {
      setTarget(readLocal<CountdownTarget | null>(localKeys.countdown, null));
      setLoading(false);
      return;
    }
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('countdown_targets')
      .select('id, target_date, label')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    setTarget(data || null);
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => { fetchTarget(); }, [fetchTarget]);

  const saveTarget = async (targetDate: string, label: string) => {
    if (isGuest) {
      const next = { id: target?.id || createLocalId('countdown'), target_date: targetDate, label };
      setTarget(next);
      writeLocal(localKeys.countdown, next);
      refreshLocalData();
      return;
    }
    if (!user) return;
    if (target) {
      await supabase.from('countdown_targets').update({ target_date: targetDate, label, updated_at: new Date().toISOString() }).eq('id', target.id);
      setTarget({ ...target, target_date: targetDate, label });
    } else {
      const { data } = await supabase.from('countdown_targets').insert({ user_id: user.id, target_date: targetDate, label }).select('id, target_date, label').single();
      if (data) setTarget(data);
    }
  };

  const clearTarget = async () => {
    if (isGuest) {
      localStorage.removeItem(localKeys.countdown);
      setTarget(null);
      refreshLocalData();
      return;
    }
    if (!user || !target) return;
    await supabase.from('countdown_targets').delete().eq('id', target.id);
    setTarget(null);
  };

  return { target, loading, saveTarget, clearTarget };
}
