import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGuestMode } from './useGuestMode';
import { createLocalId, localKeys, readLocal, writeLocal } from '@/lib/localStore';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useNotes = () => {
  const { user } = useAuth();
  const { isGuest, refreshLocalData } = useGuestMode();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setNotes(readLocal<Note[]>(localKeys.notes, []));
      setLoading(false);
      return;
    }
    if (!user) { setLoading(false); return; }

    const fetchNotes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      setNotes(
        (data || []).map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          created_at: n.created_at,
          updated_at: n.updated_at,
        }))
      );
      setLoading(false);
    };

    fetchNotes();
  }, [user, isGuest]);

  const persist = useCallback((updater: (prev: Note[]) => Note[]) => {
    setNotes(prev => {
      const next = updater(prev);
      writeLocal(localKeys.notes, next);
      refreshLocalData();
      return next;
    });
  }, [refreshLocalData]);

  const addNote = useCallback(async () => {
    if (isGuest) {
      const note: Note = { id: createLocalId('note'), title: 'Untitled', content: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      persist(prev => [note, ...prev]);
      return note;
    }
    if (!user) return null;
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title: 'Untitled', content: '' })
      .select()
      .single();

    if (!error && data) {
      const note: Note = {
        id: data.id, title: data.title, content: data.content,
        created_at: data.created_at, updated_at: data.updated_at,
      };
      setNotes(prev => [note, ...prev]);
      return note;
    }
    return null;
  }, [user, isGuest, persist]);

  const updateNote = useCallback(async (id: string, title: string, content: string) => {
    if (isGuest) {
      persist(prev => prev.map(n => n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n));
      return;
    }
    if (!user) return;
    await supabase.from('notes').update({ title, content }).eq('id', id);
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n)
    );
  }, [user, isGuest, persist]);

  const deleteNote = useCallback(async (id: string) => {
    if (isGuest) {
      persist(prev => prev.filter(n => n.id !== id));
      return;
    }
    if (!user) return;
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [user, isGuest, persist]);

  return { notes, loading, addNote, updateNote, deleteNote };
};
