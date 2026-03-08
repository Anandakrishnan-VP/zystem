import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BodyMetrics {
  id: string;
  user_id: string;
  height_cm: number;
  weight_kg: number;
  age: number;
  sex: 'male' | 'female';
  waist_cm: number | null;
  neck_cm: number | null;
  hip_cm: number | null;
  created_at: string;
  updated_at: string;
}

export const useBodyMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('body_metrics')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) setMetrics(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const saveMetrics = async (values: Omit<BodyMetrics, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    if (metrics) {
      await (supabase as any)
        .from('body_metrics')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', metrics.id);
    } else {
      await (supabase as any)
        .from('body_metrics')
        .insert({ ...values, user_id: user.id });
    }
    await fetchMetrics();
  };

  return { metrics, loading, saveMetrics };
};

// BMI = weight(kg) / height(m)^2
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

// US Navy Body Fat Formula
export const calculateBodyFat = (
  sex: 'male' | 'female',
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipCm?: number
): number | null => {
  if (sex === 'male') {
    if (waistCm <= neckCm) return null;
    return 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!hipCm || (waistCm + hipCm) <= neckCm) return null;
    return 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
  }
};

export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Underweight', color: 'hsl(200, 80%, 60%)' };
  if (bmi < 25) return { label: 'Normal', color: 'hsl(142, 76%, 36%)' };
  if (bmi < 30) return { label: 'Overweight', color: 'hsl(40, 90%, 50%)' };
  return { label: 'Obese', color: 'hsl(0, 84%, 60%)' };
};

export const getBodyFatCategory = (bf: number, sex: 'male' | 'female'): { label: string; color: string } => {
  if (sex === 'male') {
    if (bf < 6) return { label: 'Essential', color: 'hsl(200, 80%, 60%)' };
    if (bf < 14) return { label: 'Athletic', color: 'hsl(142, 76%, 36%)' };
    if (bf < 18) return { label: 'Fitness', color: 'hsl(80, 70%, 45%)' };
    if (bf < 25) return { label: 'Average', color: 'hsl(40, 90%, 50%)' };
    return { label: 'High', color: 'hsl(0, 84%, 60%)' };
  } else {
    if (bf < 14) return { label: 'Essential', color: 'hsl(200, 80%, 60%)' };
    if (bf < 21) return { label: 'Athletic', color: 'hsl(142, 76%, 36%)' };
    if (bf < 25) return { label: 'Fitness', color: 'hsl(80, 70%, 45%)' };
    if (bf < 32) return { label: 'Average', color: 'hsl(40, 90%, 50%)' };
    return { label: 'High', color: 'hsl(0, 84%, 60%)' };
  }
};
