import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LinkGroup {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface SavedLink {
  id: string;
  group_id: string;
  title: string;
  url: string;
  notes: string;
  tags: string[];
  sort_order: number;
  created_at: string;
}

export function useLibrary() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [gRes, lRes] = await Promise.all([
      supabase.from('link_groups').select('id, name, sort_order, created_at').eq('user_id', user.id).order('sort_order'),
      supabase.from('saved_links').select('id, group_id, title, url, notes, tags, sort_order, created_at').eq('user_id', user.id).order('sort_order'),
    ]);
    if (gRes.data) setGroups(gRes.data);
    if (lRes.data) setLinks(lRes.data as SavedLink[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addGroup = async (name: string) => {
    if (!user) return;
    const { data } = await supabase.from('link_groups').insert({ user_id: user.id, name, sort_order: groups.length }).select('id, name, sort_order, created_at').single();
    if (data) setGroups(prev => [...prev, data]);
  };

  const updateGroup = async (id: string, name: string) => {
    await supabase.from('link_groups').update({ name }).eq('id', id);
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  };

  const deleteGroup = async (id: string) => {
    await supabase.from('link_groups').delete().eq('id', id);
    setGroups(prev => prev.filter(g => g.id !== id));
    setLinks(prev => prev.filter(l => l.group_id !== id));
  };

  const addLink = async (groupId: string, title: string, url: string, notes = '', tags: string[] = []) => {
    if (!user) return;
    const groupLinks = links.filter(l => l.group_id === groupId);
    const { data } = await supabase.from('saved_links').insert({
      user_id: user.id, group_id: groupId, title, url, notes, tags, sort_order: groupLinks.length,
    }).select('id, group_id, title, url, notes, tags, sort_order, created_at').single();
    if (data) setLinks(prev => [...prev, data as SavedLink]);
  };

  const updateLink = async (id: string, updates: Partial<Pick<SavedLink, 'title' | 'url' | 'notes' | 'tags' | 'group_id'>>) => {
    await supabase.from('saved_links').update(updates).eq('id', id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLink = async (id: string) => {
    await supabase.from('saved_links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const getLinksForGroup = (groupId: string) => links.filter(l => l.group_id === groupId);

  return { groups, links, loading, addGroup, updateGroup, deleteGroup, addLink, updateLink, deleteLink, getLinksForGroup };
}
