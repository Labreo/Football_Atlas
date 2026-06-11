import { create } from 'zustand';
import { NarrationTimeline, NarrationSegment } from './types';

export type AudioPlaybackState = 'playing' | 'paused' | 'stopped';

export interface AudioCommentaryState {
  enabled: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  playbackSpeed: 1 | 0.75 | 1.25 | 1.5;
  volume: number;
  currentTime: number;
  duration: number;
  currentSegment: NarrationSegment | null;
  upcomingSegment: NarrationSegment | null;
  captionText: string;
  timeline: NarrationTimeline | null;
  error: string | null;
  inspectorOpen: boolean;
  setEnabled: (enabled: boolean) => void;
  setPlaybackSpeed: (speed: AudioCommentaryState['playbackSpeed']) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setTimeline: (timeline: NarrationTimeline | null) => void;
  setCurrentTime: (time: number) => void;
  setCurrentSegment: (segment: NarrationSegment | null) => void;
  setUpcomingSegment: (segment: NarrationSegment | null) => void;
  setCaptionText: (text: string) => void;
  setError: (error: string | null) => void;
  setInspectorOpen: (open: boolean) => void;
}

export const useAudioCommentaryStore = create<AudioCommentaryState>((set) => ({
  enabled: false,
  isPlaying: false,
  isMuted: false,
  playbackSpeed: 1,
  volume: 0.9,
  currentTime: 0,
  duration: 0,
  currentSegment: null,
  upcomingSegment: null,
  captionText: '',
  timeline: null,
  error: null,
  inspectorOpen: false,

  setEnabled: (enabled) => set({ enabled }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
  setTimeline: (timeline) => set({ timeline, duration: timeline?.durationSeconds || 0, currentTime: 0, currentSegment: null, upcomingSegment: timeline?.segments[0] || null, captionText: '' }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setCurrentSegment: (currentSegment) => set({ currentSegment, captionText: currentSegment?.text || '' }),
  setUpcomingSegment: (upcomingSegment) => set({ upcomingSegment }),
  setCaptionText: (captionText) => set({ captionText }),
  setError: (error) => set({ error }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
}));
