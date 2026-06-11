import React from 'react';
import { useAudioCommentaryStore } from '../../audioCommentary/useAudioCommentaryStore';

export const AudioCaptionDisplay: React.FC = () => {
  const { captionText, enabled } = useAudioCommentaryStore();
  if (!enabled || !captionText) return null;
  return (
    <div className="rounded-2xl border border-[#23324C]/60 bg-[#101623]/85 p-4 text-[12px] text-slate-100 shadow-inner">
      <p className="font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">Narration Caption</p>
      <p className="leading-6 text-slate-100">{captionText}</p>
    </div>
  );
};
