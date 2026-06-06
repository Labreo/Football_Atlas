import React, { useEffect, useState } from 'react';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';
import { VisualLanguageRegistry } from './VisualLanguageRegistry';
import { TacticalEventType, EventSignature } from './types';
import { useTacticalStore } from '../stores/useTacticalStore';

export const VisualSignatureHUD: React.FC = () => {
  const [activeChip, setActiveChip] = useState<{
    signature: EventSignature;
    timestamp: number;
  } | null>(null);

  const visualMode = useTacticalStore((state) => state.visualMode);

  useEffect(() => {
    const engine = learningOrchestrator.getEngine();
    if (!engine) return;

    let lastActiveEventTypes: TacticalEventType[] = [];

    const unsubscribe = engine.subscribeTelemetry((telemetry) => {
      const activeModule = learningOrchestrator.getActiveModule();
      if (!activeModule || !activeModule.getActiveEventTypes) return;

      const currentActive = activeModule.getActiveEventTypes(telemetry.currentTime);
      
      // Find newly activated event types
      const newlyActivated = currentActive.filter(
        (et: TacticalEventType) => !lastActiveEventTypes.includes(et)
      );

      if (newlyActivated.length > 0) {
        // Show the first newly activated one
        const et = newlyActivated[0];
        const signature = VisualLanguageRegistry.getSignature(et, visualMode);
        setActiveChip({
          signature,
          timestamp: Date.now(),
        });
      }

      lastActiveEventTypes = currentActive;
    });

    return () => unsubscribe();
  }, [visualMode]);

  // Disappear after 2.5s
  useEffect(() => {
    if (!activeChip) return;
    const elapsed = Date.now() - activeChip.timestamp;
    const remaining = 2500 - elapsed;

    if (remaining <= 0) {
      setActiveChip(null);
      return;
    }

    const timer = setTimeout(() => {
      setActiveChip(null);
    }, remaining);

    return () => clearTimeout(timer);
  }, [activeChip]);

  if (!activeChip) return null;

  const { signature } = activeChip;
  const color = signature.overlay?.color ?? signature.arrow?.color ?? '#FFFFFF';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '20px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${color}44`,
        borderRadius: '12px',
        padding: '12px 16px',
        maxWidth: '300px',
        color: '#F8FAFC',
        boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 0 15px ${color}1e`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'tvls-fade-in 0.25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            animation: 'tvls-pulse 1.2s infinite alternate',
          }}
        />
        <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '0.02em' }}>
          {signature.displayName}
        </span>
      </div>
      <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: '1.4' }}>
        {signature.description}
      </p>

      <style>{`
        @keyframes tvls-fade-in {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tvls-pulse {
          from { transform: scale(0.9); opacity: 0.8; }
          to { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
export default VisualSignatureHUD;
