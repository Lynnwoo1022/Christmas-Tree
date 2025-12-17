import { create } from 'zustand';
import { Phase, GestureType } from './types';

interface AppState {
  phase: Phase;
  gesture: GestureType;
  activePhotoIndex: number;
  setPhase: (phase: Phase) => void;
  setGesture: (gesture: GestureType) => void;
  setActivePhotoIndex: (index: number) => void;
  nextPhoto: () => void;
  prevPhoto: () => void;
  audioPlaying: boolean;
  setAudioPlaying: (playing: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  phase: 'tree',
  gesture: GestureType.None,
  activePhotoIndex: 0,
  audioPlaying: false,

  setPhase: (phase) => set({ phase }),
  setGesture: (gesture) => set({ gesture }),
  setActivePhotoIndex: (index) => set({ activePhotoIndex: index }),
  setAudioPlaying: (playing) => set({ audioPlaying: playing }),

  nextPhoto: () => set((state) => ({
    activePhotoIndex: (state.activePhotoIndex + 1) % 24
  })),
  prevPhoto: () => set((state) => ({
    activePhotoIndex: (state.activePhotoIndex - 1 + 24) % 24
  })),
}));
