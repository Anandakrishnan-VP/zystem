import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGuestMode } from './useGuestMode';
import { GUEST_ID, localKeys, readLocal, writeLocal } from '@/lib/localStore';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const CACHE_PREFIX = 'profile_cache_';

const getCachedProfile = (userId: string): Profile | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedProfile = (userId: string, profile: Profile | null) => {
  try {
    if (profile) {
      localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(profile));
    } else {
      localStorage.removeItem(CACHE_PREFIX + userId);
    }
  } catch {
    // ignore quota errors
  }
};

export const useProfile = () => {
  const { user } = useAuth();
  const { isGuest, refreshLocalData } = useGuestMode();
  const [profile, setProfile] = useState<Profile | null>(() => {
    // Synchronously hydrate from cache to skip loading on repeat visits
    if (typeof window === 'undefined') return null;
    // We don't have user yet on first render in some cases; try last cached user
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (isGuest) {
      const guestProfile = readLocal<Profile | null>(localKeys.profile, null) || {
        id: GUEST_ID,
        user_id: GUEST_ID,
        username: 'Guest',
        avatar_url: '/avatars/avatar-3.png',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      writeLocal(localKeys.profile, guestProfile);
      setProfile(guestProfile);
      setLoading(false);
      setHasLoadedProfile(true);
      refreshLocalData();
      return;
    }

    if (!user) {
      setProfile(null);
      setHasLoadedProfile(false);
      setLoading(false);
      return;
    }

    // Hydrate from cache immediately — no spinner for returning users
    const cached = getCachedProfile(user.id);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      setHasLoadedProfile(true);
    } else {
      setLoading(true);
      setHasLoadedProfile(false);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
        setCachedProfile(user.id, data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setHasLoadedProfile(true);
    }
  }, [user, isGuest, refreshLocalData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (username: string, avatar_url: string) => {
    if (isGuest) {
      const nextProfile: Profile = {
        id: profile?.id || GUEST_ID,
        user_id: GUEST_ID,
        username,
        avatar_url,
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(nextProfile);
      writeLocal(localKeys.profile, nextProfile);
      refreshLocalData();
      return { error: null };
    }

    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update({ username, avatar_url, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (!error) {
      await fetchProfile();
    }

    return { error };
  };

  const isProfileComplete = profile?.username && profile?.avatar_url;

  return {
    profile,
    loading,
    hasLoadedProfile,
    updateProfile,
    isProfileComplete,
    refetchProfile: fetchProfile,
  };
};
