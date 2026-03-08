import { useEffect } from 'react';
import { useProfile } from './useProfile';

const AVATAR_THEME_MAP: Record<string, string> = {
  '/avatars/avatar-1.png': 'fire',
  '/avatars/avatar-2.png': 'water',
  '/avatars/avatar-3.png': 'air',
  '/avatars/avatar-4.png': 'electric',
};

export const useAvatarTheme = () => {
  const { profile } = useProfile();

  useEffect(() => {
    const theme = profile?.avatar_url
      ? AVATAR_THEME_MAP[profile.avatar_url] || 'air'
      : 'air';
    document.documentElement.setAttribute('data-theme', theme);

    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [profile?.avatar_url]);
};
