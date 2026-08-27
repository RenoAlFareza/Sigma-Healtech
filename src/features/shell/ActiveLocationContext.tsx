"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';

interface ActiveLocationContextValue {
  activeLocationId: string | null;
  setActiveLocationId: (locationId: string) => void;
}

const ActiveLocationContext = createContext<ActiveLocationContextValue | null>(null);

export function ActiveLocationProvider({ children }: { children: React.ReactNode }) {
  const { defaultLocationId } = useAuth();
  const [activeLocationId, setActiveLocationId] = useState<string | null>(defaultLocationId);

  useEffect(() => {
    if (defaultLocationId && !activeLocationId) {
      setActiveLocationId(defaultLocationId);
    }
  }, [defaultLocationId, activeLocationId]);

  return (
    <ActiveLocationContext.Provider value={{ activeLocationId: activeLocationId || defaultLocationId, setActiveLocationId }}>
      {children}
    </ActiveLocationContext.Provider>
  );
}

export function useActiveLocation() {
  const context = useContext(ActiveLocationContext);
  if (!context) {
    throw new Error('useActiveLocation must be used within an ActiveLocationProvider');
  }
  return context;
}
