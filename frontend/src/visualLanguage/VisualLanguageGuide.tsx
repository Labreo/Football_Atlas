import React, { useState } from 'react';
import { VisualLanguageRegistry } from './VisualLanguageRegistry';
import { useTacticalStore } from '../stores/useTacticalStore';
import { SignatureMiniDemo } from './SignatureMiniDemo';

export const VisualLanguageGuide: React.FC = () => {
  const [selectedEventType, setSelectedEventType] = useState(
    VisualLanguageRegistry.getAllEventTypes()[0]
  );
  
  const visualMode = useTacticalStore((state) => state.visualMode);
  const setVisualMode = useTacticalStore((state) => state.setVisualMode);
  const [colorBlindMode, setColorBlindMode] = useState(false);

  const eventTypes = VisualLanguageRegistry.getAllEventTypes();
  const selectedSignature = VisualLanguageRegistry.getSignature(selectedEventType, visualMode);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px',
        background: '#0b0f19',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        color: '#f8fafc',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#38bdf8' }}>
            Tactical Visual Language System (TVLS)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
            The universal visual vocabulary used across all concepts, breakdowns, and historical examples.
          </p>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setVisualMode(visualMode === 'concept' ? 'historical' : 'concept')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: visualMode === 'historical' ? '#c8a96e22' : '#1e293b',
              color: visualMode === 'historical' ? '#c8a96e' : '#f8fafc',
              borderColor: visualMode === 'historical' ? '#c8a96e' : '#334155',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Mode: {visualMode === 'historical' ? '🏛️ Historical' : '💡 Concept'}
          </button>
          <button
            onClick={() => setColorBlindMode(!colorBlindMode)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: colorBlindMode ? '#0284c722' : '#1e293b',
              color: colorBlindMode ? '#38bdf8' : '#f8fafc',
              borderColor: colorBlindMode ? '#38bdf8' : '#334155',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            👓 Color Blind Mode: {colorBlindMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Side: Concept Selector Grid */}
        <div
          style={{
            flex: '1 1 250px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '480px',
            overflowY: 'auto',
            paddingRight: '8px',
          }}
        >
          {eventTypes.map((et) => {
            const sig = VisualLanguageRegistry.getSignature(et, visualMode);
            const active = et === selectedEventType;
            const sigColor = sig.overlay?.color ?? sig.arrow?.color ?? '#FFFFFF';

            return (
              <button
                key={et}
                onClick={() => setSelectedEventType(et)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: active ? sigColor : '#1e293b',
                  background: active ? `${sigColor}11` : '#111827',
                  color: active ? '#ffffff' : '#94a3b8',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: sigColor,
                    boxShadow: `0 0 6px ${sigColor}`,
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{sig.displayName}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Detailed Details Card */}
        <div
          style={{
            flex: '2 2 500px',
            background: '#111827',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Top Detail Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                  {selectedSignature.displayName}
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#1e293b',
                    fontSize: '11px',
                    color: '#cbd5e1',
                  }}
                >
                  {selectedSignature.eventType}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {selectedSignature.description}
              </p>
            </div>

            {/* Live 3D Mini Demo */}
            <div style={{ flex: '0 0 200px' }}>
              <SignatureMiniDemo key={`${selectedEventType}_${visualMode}`} signature={selectedSignature} />
            </div>
          </div>

          {/* Style Attributes & Accessibility */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Visual Style Definition
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                <div>Color: <span style={{ fontFamily: 'monospace', color: selectedSignature.overlay?.color ?? selectedSignature.arrow?.color }}>{selectedSignature.overlay?.color ?? selectedSignature.arrow?.color}</span></div>
                {selectedSignature.arrow && (
                  <>
                    <div>Width: {selectedSignature.arrow.width} world units</div>
                    <div>Line style: {selectedSignature.arrow.dashed ? 'Dashed' : 'Solid'}</div>
                  </>
                )}
                {selectedSignature.overlay && (
                  <div>Render Mode: <span style={{ fontFamily: 'monospace' }}>{selectedSignature.overlay.mode}</span></div>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Accessibility Profile
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#94a3b8' }}>
                <div>Shape variant: <b>{selectedSignature.accessibility.shapeId}</b></div>
                <div>Motion spec: <i>{selectedSignature.accessibility.motionDescription}</i></div>
                <div>Rhythm / timing: <span>{selectedSignature.accessibility.timingPattern}</span></div>
                {colorBlindMode && (
                  <div style={{ color: '#e2e8f0', background: '#0284c733', padding: '4px 8px', borderRadius: '4px', marginTop: '4px' }}>
                    Fallback style: <b>{selectedSignature.accessibility.colorBlindLineStyle}</b>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Where it is used */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Used In Platform Concepts
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedSignature.usedIn.map((concept) => (
                <span
                  key={concept}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    fontSize: '12px',
                    color: '#9ca3af',
                  }}
                >
                  {concept.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VisualLanguageGuide;
