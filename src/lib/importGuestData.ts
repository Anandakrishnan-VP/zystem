import { supabase } from '@/integrations/supabase/client';
import { localKeys, readLocal } from '@/lib/localStore';
import type { HabitData } from '@/hooks/useHabitData';
import type { Note } from '@/hooks/useNotes';
import type { LinkGroup, SavedLink } from '@/hooks/useLibrary';
import type { Profile } from '@/hooks/useProfile';

export const importGuestDataToAccount = async (userId: string) => {
  const profile = readLocal<Profile | null>(localKeys.profile, null);
  if (profile) {
    await supabase.from('profiles').update({ username: profile.username, avatar_url: profile.avatar_url, updated_at: new Date().toISOString() }).eq('user_id', userId);
  }

  const habitData = readLocal<HabitData>(localKeys.habitData, { habitCompletions: {}, habitList: [], bucketList: [], todos: [] });
  const habitIdMap = new Map<string, string>();
  for (const habit of habitData.habitList) {
    const { data } = await supabase.from('habits').insert({ user_id: userId, name: habit.name, day_of_week: habit.dayOfWeek, sort_order: habitIdMap.size }).select('id').single();
    if (data?.id) habitIdMap.set(habit.id, data.id);
  }
  const completions = Object.entries(habitData.habitCompletions).flatMap(([localHabitId, dates]) =>
    Object.entries(dates).filter(([, completed]) => completed).map(([date]) => ({
      user_id: userId,
      habit_id: habitIdMap.get(localHabitId) || localHabitId,
      day_of_week: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
      week_start: date,
      completion_date: date,
      completed: true,
    }))
  ).filter(row => !row.habit_id.startsWith('local-'));
  if (completions.length) await supabase.from('habit_completions').insert(completions);
  if (habitData.todos.length) await supabase.from('todos').insert(habitData.todos.map(t => ({ user_id: userId, title: t.title, deadline: t.deadline, completed: t.completed })));
  if (habitData.bucketList.length) await supabase.from('bucket_list').insert(habitData.bucketList.map(b => ({ user_id: userId, text: b.text, year: b.year, completed: b.completed })));

  const notes = readLocal<Note[]>(localKeys.notes, []);
  if (notes.length) await supabase.from('notes').insert(notes.map(n => ({ user_id: userId, title: n.title, content: n.content })));

  const library = readLocal<{ groups: LinkGroup[]; links: SavedLink[] }>(localKeys.library, { groups: [], links: [] });
  const groupIdMap = new Map<string, string>();
  for (const group of library.groups) {
    const { data } = await supabase.from('link_groups').insert({ user_id: userId, name: group.name, sort_order: group.sort_order }).select('id').single();
    if (data?.id) groupIdMap.set(group.id, data.id);
  }
  const links = library.links.map(l => ({ user_id: userId, group_id: groupIdMap.get(l.group_id), title: l.title, url: l.url, notes: l.notes, tags: l.tags, sort_order: l.sort_order })).filter(l => l.group_id);
  if (links.length) await supabase.from('saved_links').insert(links as any);
};