import React, { createContext, useContext, useEffect } from 'react';
import { useTacticalStore } from '../stores/useTacticalStore';
import { VisualMode } from './types';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';

interface VisualLanguageContextType {
  visualMode: VisualMode;
  setVisualMode: (mode: VisualMode) => void;
}

const VisualLanguageContext = createContext<VisualLanguageContextType | undefined>(undefined);

export const VisualLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const visualMode = useTacticalStore((state) => state.visualMode);
  const setVisualMode = useTacticalStore((state) => state.setVisualMode);

  useEffect(() => {
    analyticsTracker.track('visual_mode_changed', { mode: visualMode });
  }, [visualMode]);

  return (
    <VisualLanguageContext.Provider value={{ visualMode, setVisualMode }}>
      {children}
    </VisualLanguageContext.Provider>
  );
};

export const useVisualLanguage = (): VisualLanguageContextType => {
  const context = useContext(VisualLanguageContext);
  if (!context) {
    throw new Error('useVisualLanguage must be used within a VisualLanguageProvider');
  }
  return context;
};
