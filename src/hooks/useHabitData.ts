import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGuestMode } from './useGuestMode';
import { createLocalId, localKeys, readLocal, writeLocal } from '@/lib/localStore';

export interface Habit {
  id: string;
  name: string;
  dayOfWeek: string | null;
}

export interface Todo {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

export interface BucketItem {
  id: string;
  text: string;
  year: number;
  completed: boolean;
}

export interface HabitData {
  // Now keyed by habitId -> date string (YYYY-MM-DD) -> boolean
  habitCompletions: Record<string, Record<string, boolean>>;
  habitList: Habit[];
  bucketList: BucketItem[];
  todos: Todo[];
}

// Get today's date as YYYY-MM-DD
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get day of week from date
export const getDayOfWeek = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

export const useHabitData = () => {
  const { user } = useAuth();
  const { isGuest, refreshLocalData } = useGuestMode();
  const [data, setData] = useState<HabitData>({
    habitCompletions: {},
    habitList: [],
    bucketList: [],
    todos: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    if (isGuest) {
      setData(readLocal<HabitData>(localKeys.habitData, { habitCompletions: {}, habitList: [], bucketList: [], todos: [] }));
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Fetch habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .order('sort_order', { ascending: true });

      // Fetch all habit completions (we'll filter by date in the component)
      const { data: completions } = await supabase
        .from('habit_completions')
        .select('*');

      // Fetch todos
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .order('deadline', { ascending: true });

      // Fetch bucket list
      const { data: bucketItems } = await supabase
        .from('bucket_list')
        .select('*')
        .order('created_at', { ascending: true });

      // Build habitCompletions map: habitId -> date -> boolean
      const habitCompletions: Record<string, Record<string, boolean>> = {};
      (completions || []).forEach(c => {
        if (c.completion_date) {
          if (!habitCompletions[c.habit_id]) {
            habitCompletions[c.habit_id] = {};
          }
          habitCompletions[c.habit_id][c.completion_date] = c.completed;
        }
      });

      setData({
        habitList: (habits || []).map(h => ({ id: h.id, name: h.name, dayOfWeek: h.day_of_week })),
        habitCompletions,
        todos: (todos || []).map(t => ({
          id: t.id,
          title: t.title,
          deadline: t.deadline,
          completed: t.completed
        })),
        bucketList: (bucketItems || []).map(b => ({
          id: b.id,
          text: b.text,
          year: b.year,
          completed: b.completed
        }))
      });

      setLoading(false);
    };

    fetchData();
  }, [user, isGuest]);

  const persistGuest = useCallback((updater: (prev: HabitData) => HabitData) => {
    setData(prev => {
      const next = updater(prev);
      writeLocal(localKeys.habitData, next);
      refreshLocalData();
      return next;
    });
  }, [refreshLocalData]);

  // Toggle habit completion for a specific date
  const toggleHabitCompletion = useCallback(async (habitId: string, date: string) => {
    if (isGuest) {
      const currentValue = data.habitCompletions[habitId]?.[date] || false;
      persistGuest(prev => ({
        ...prev,
        habitCompletions: {
          ...prev.habitCompletions,
          [habitId]: { ...prev.habitCompletions[habitId], [date]: !currentValue }
        }
      }));
      return;
    }
    if (!user) return;
    
    const currentValue = data.habitCompletions[habitId]?.[date] || false;
    const dayOfWeek = getDayOfWeek(date);

    // Optimistic update
    setData(prev => ({
      ...prev,
      habitCompletions: {
        ...prev.habitCompletions,
        [habitId]: {
          ...prev.habitCompletions[habitId],
          [date]: !currentValue
        }
      }
    }));

    if (currentValue) {
      // Delete the completion
      await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completion_date', date);
    } else {
      // Insert completion
      await supabase
        .from('habit_completions')
        .insert({
          user_id: user.id,
          habit_id: habitId,
          day_of_week: dayOfWeek,
          week_start: date, // Keep for backwards compat
          completion_date: date,
          completed: true
        });
    }
  }, [user, data.habitCompletions, isGuest, persistGuest]);

  // Add new habit
  const addHabit = useCallback(async (name: string, dayOfWeek?: string) => {
    if (isGuest) {
      persistGuest(prev => ({
        ...prev,
        habitList: [...prev.habitList, { id: createLocalId('habit'), name, dayOfWeek: dayOfWeek || null }]
      }));
      return;
    }
    if (!user) return;

    const { data: newHabit, error } = await supabase
      .from('habits')
      .insert({ 
        user_id: user.id, 
        name, 
        sort_order: data.habitList.length,
        day_of_week: dayOfWeek || null
      })
      .select()
      .single();

    if (!error && newHabit) {
      setData(prev => ({
        ...prev,
        habitList: [...prev.habitList, { id: newHabit.id, name: newHabit.name, dayOfWeek: newHabit.day_of_week }]
      }));
    }
  }, [user, data.habitList.length, isGuest, persistGuest]);

  // Edit habit
  const editHabit = useCallback(async (id: string, newName: string) => {
    if (isGuest) {
      persistGuest(prev => ({ ...prev, habitList: prev.habitList.map(h => h.id === id ? { ...h, name: newName } : h) }));
      return;
    }
    if (!user) return;

    await supabase
      .from('habits')
      .update({ name: newName })
      .eq('id', id);

    setData(prev => ({
      ...prev,
      habitList: prev.habitList.map(h => 
        h.id === id ? { ...h, name: newName } : h
      )
    }));
  }, [user, isGuest, persistGuest]);

  // Delete habit
  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return;

    await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    setData(prev => {
      const { [id]: removed, ...remainingCompletions } = prev.habitCompletions;
      return {
        ...prev,
        habitList: prev.habitList.filter(h => h.id !== id),
        habitCompletions: remainingCompletions
      };
    });
  }, [user]);

  // Add bucket item
  const addBucketItem = useCallback(async (text: string, year: number) => {
    if (!user) return;

    const { data: newItem, error } = await supabase
      .from('bucket_list')
      .insert({ user_id: user.id, text, year, completed: false })
      .select()
      .single();

    if (!error && newItem) {
      setData(prev => ({
        ...prev,
        bucketList: [...prev.bucketList, {
          id: newItem.id,
          text: newItem.text,
          year: newItem.year,
          completed: newItem.completed
        }]
      }));
    }
  }, [user]);

  // Toggle bucket item
  const toggleBucketItem = useCallback(async (id: string) => {
    if (!user) return;

    const item = data.bucketList.find(b => b.id === id);
    if (!item) return;

    await supabase
      .from('bucket_list')
      .update({ completed: !item.completed })
      .eq('id', id);

    setData(prev => ({
      ...prev,
      bucketList: prev.bucketList.map(b =>
        b.id === id ? { ...b, completed: !b.completed } : b
      )
    }));
  }, [user, data.bucketList]);

  // Remove bucket item
  const removeBucketItem = useCallback(async (id: string) => {
    if (!user) return;

    await supabase
      .from('bucket_list')
      .delete()
      .eq('id', id);

    setData(prev => ({
      ...prev,
      bucketList: prev.bucketList.filter(b => b.id !== id)
    }));
  }, [user]);

  // Add todo
  const addTodo = useCallback(async (title: string, deadline: string) => {
    if (!user) return;

    const { data: newTodo, error } = await supabase
      .from('todos')
      .insert({ user_id: user.id, title, deadline, completed: false })
      .select()
      .single();

    if (!error && newTodo) {
      setData(prev => ({
        ...prev,
        todos: [...prev.todos, {
          id: newTodo.id,
          title: newTodo.title,
          deadline: newTodo.deadline,
          completed: newTodo.completed
        }]
      }));
    }
  }, [user]);

  // Toggle todo
  const toggleTodo = useCallback(async (id: string) => {
    if (!user) return;

    const todo = data.todos.find(t => t.id === id);
    if (!todo) return;

    await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id);

    setData(prev => ({
      ...prev,
      todos: prev.todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  }, [user, data.todos]);

  // Remove todo
  const removeTodo = useCallback(async (id: string) => {
    if (!user) return;

    await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    setData(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== id)
    }));
  }, [user]);

  return {
    data,
    loading,
    toggleHabitCompletion,
    addHabit,
    editHabit,
    deleteHabit,
    addBucketItem,
    toggleBucketItem,
    removeBucketItem,
    addTodo,
    toggleTodo,
    removeTodo
  };
};
