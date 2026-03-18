import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [user]);

  const addNote = useCallback(async () => {
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
  }, [user]);

  const updateNote = useCallback(async (id: string, title: string, content: string) => {
    if (!user) return;
    await supabase.from('notes').update({ title, content }).eq('id', id);
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n)
    );
  }, [user]);

  const deleteNote = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [user]);

  return { notes, loading, addNote, updateNote, deleteNote };
};
