import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CountdownTarget {
  id: string;
  target_date: string;
  label: string;
}

export function useCountdown() {
  const { user } = useAuth();
  const [target, setTarget] = useState<CountdownTarget | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTarget = useCallback(async () => {
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
  }, [user]);

  useEffect(() => { fetchTarget(); }, [fetchTarget]);

  const saveTarget = async (targetDate: string, label: string) => {
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
    if (!user || !target) return;
    await supabase.from('countdown_targets').delete().eq('id', target.id);
    setTarget(null);
  };

  return { target, loading, saveTarget, clearTarget };
}
