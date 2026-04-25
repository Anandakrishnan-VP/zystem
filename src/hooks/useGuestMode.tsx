import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { GUEST_MODE_KEY, hasGuestData } from '@/lib/localStore';

interface GuestModeContextType {
  isGuest: boolean;
  hasLocalData: boolean;
  continueAsGuest: () => void;
  exitGuest: () => void;
  refreshLocalData: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export const GuestModeProvider = ({ children }: { children: ReactNode }) => {
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_MODE_KEY) === 'true');
  const [hasLocalDataState, setHasLocalDataState] = useState(hasGuestData);

  const value = useMemo(() => ({
    isGuest,
    hasLocalData: hasLocalDataState,
    continueAsGuest: () => {
      localStorage.setItem(GUEST_MODE_KEY, 'true');
      setIsGuest(true);
      setHasLocalDataState(hasGuestData());
    },
    exitGuest: () => {
      localStorage.removeItem(GUEST_MODE_KEY);
      setIsGuest(false);
      setHasLocalDataState(hasGuestData());
    },
    refreshLocalData: () => setHasLocalDataState(hasGuestData()),
  }), [isGuest, hasLocalDataState]);

  return <GuestModeContext.Provider value={value}>{children}</GuestModeContext.Provider>;
};

export const useGuestMode = () => {
  const context = useContext(GuestModeContext);
  if (!context) throw new Error('useGuestMode must be used within GuestModeProvider');
  return context;
};