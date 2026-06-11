import React, { useState } from 'react';
import { useAudioCommentaryStore } from '../../audioCommentary/useAudioCommentaryStore';
import { audioCommentaryManager } from '../../audioCommentary/AudioCommentaryManager';

const speeds = [0.75, 1, 1.25, 1.5] as const;

export const AudioCommentaryPanel: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const {
    enabled,
    isPlaying,
    isMuted,
    playbackSpeed,
    volume,
    currentTime,
    duration,
    currentSegment,
    upcomingSegment,
    error,
    setEnabled,
    setPlaybackSpeed,
    setMuted,
    setVolume,
  } = useAudioCommentaryStore();

  const toggleAudio = async () => {
    if (enabled) {
      audioCommentaryManager.stop();
      setEnabled(false);
      audioCommentaryManager.setMute(false);
      audioCommentaryManager.setVolume(volume);
    } else {
      setEnabled(true);
      audioCommentaryManager.setPlaybackSpeed(playbackSpeed);
      audioCommentaryManager.setMute(isMuted);
      audioCommentaryManager.setVolume(volume);
      await audioCommentaryManager.play();
    }
  };

  const handleSpeed = async (speedValue: number) => {
    setPlaybackSpeed(speedValue as typeof playbackSpeed);
    audioCommentaryManager.setPlaybackSpeed(speedValue);
  };

  const handleMuteToggle = () => {
    setMuted(!isMuted);
    audioCommentaryManager.setMute(!isMuted);
  };

  const handleVolume = (value: number) => {
    setVolume(value);
    audioCommentaryManager.setVolume(value);
  };

  const handlePlayPause = async () => {
    if (!enabled) return;
    if (isPlaying) {
      audioCommentaryManager.pause();
    } else {
      await audioCommentaryManager.play();
    }
  };

  const handleRestart = () => {
    audioCommentaryManager.restart();
  };

  const progressLabel = duration > 0 ? `${Math.min(100, Math.round((currentTime / duration) * 100))}%` : '0%';

  if (!expanded) {
    return (
      <div className="rounded-2xl border border-[#23324C]/60 bg-[#101623]/85 p-3 shadow-inner">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Audio Commentary</p>
            <p className="text-[11px] text-slate-300 truncate max-w-[180px]">
              {enabled ? 'Enabled' : 'Tap to enable concise narrated guidance.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase transition-all ${enabled ? 'bg-[#10B981] text-slate-950' : 'bg-[#182235] text-slate-300 hover:bg-[#222E45]'}`}
            >
              {enabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setExpanded(true)}
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase bg-[#111A2C] text-slate-300 hover:bg-[#182235] transition-colors"
            >
              Open
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
          <span>Speed {playbackSpeed}x</span>
          <span>{enabled ? (isPlaying ? 'Playing' : 'Paused') : 'Disabled'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#23324C]/60 bg-[#101623]/85 p-4 shadow-inner">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Audio Commentary</p>
          <p className="text-[11px] text-slate-300">Narrated tactical explanations synchronized with the pitch animation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(false)}
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase bg-[#111A2C] text-slate-300 hover:bg-[#182235] transition-colors"
          >
            Close
          </button>
          <button
            onClick={toggleAudio}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${enabled ? 'bg-[#10B981] text-slate-950' : 'bg-[#182235] text-slate-300 hover:bg-[#222E45]'}`}
            aria-pressed={enabled}
          >
            {enabled ? 'Enabled' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={handlePlayPause}
          disabled={!enabled}
          className="w-full rounded-xl bg-[#111A2C] text-[10px] font-bold uppercase text-slate-200 py-2 disabled:opacity-40"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={handleRestart}
          disabled={!enabled}
          className="w-full rounded-xl bg-[#111A2C] text-[10px] font-bold uppercase text-slate-200 py-2 disabled:opacity-40"
        >
          Restart
        </button>
      </div>

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 mb-3">
        {speeds.map((speed) => (
          <button
            key={speed}
            onClick={() => handleSpeed(speed)}
            className={`rounded-full px-2 py-1 transition-colors ${playbackSpeed === speed ? 'bg-[#10B981] text-slate-950' : 'bg-[#111A2C] text-slate-400 hover:bg-[#182235]'}`}
          >
            {speed}x
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleMuteToggle}
          className={`rounded-full p-2 transition-colors ${isMuted ? 'bg-[#FF4D6D] text-white' : 'bg-[#111A2C] text-slate-300 hover:bg-[#182235]'}`}
          aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => handleVolume(parseFloat(event.target.value))}
            className="w-full"
            aria-label="Audio volume"
          />
        </div>
        <span className="text-[10px] font-semibold text-slate-300">{Math.round(volume * 100)}%</span>
      </div>

      <div className="border border-[#23324C]/40 rounded-xl bg-[#0D1420] p-3 text-[11px] text-slate-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400">Progress</span>
          <span>{progressLabel}</span>
        </div>
        <div className="h-2 rounded-full bg-[#111A2C] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#10B981] to-[#00F3FF] transition-all" style={{ width: `${duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-2 text-[10px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>Current segment</span>
          <span>{currentSegment?.id ?? 'Waiting...'}</span>
        </div>
        {currentSegment && (
          <div className="rounded-xl bg-[#131A31] border border-[#23324C]/40 p-3 text-[11px] text-slate-200 leading-snug min-h-[70px]">
            {currentSegment.text}
          </div>
        )}
        {upcomingSegment && (
          <div className="rounded-xl bg-[#0E1628] border border-[#1B2A46]/40 p-2 text-[10px] text-slate-400">
            <strong className="text-slate-200">Up next:</strong> {upcomingSegment.text}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-[10px] text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};
