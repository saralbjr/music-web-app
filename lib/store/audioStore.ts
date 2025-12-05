import { create } from 'zustand';
import { ISong } from '@/models/Song';
import { fisherYatesShuffle } from '@/lib/algorithms/shuffle';

/**
 * Audio Player State Interface
 * Manages the global state of the audio player
 */
interface AudioState {
  // Current song being played
  currentSong: ISong | null;
  // Queue of songs to play
  queue: ISong[];
  // Current index in queue
  currentIndex: number;
  // Whether audio is playing
  isPlaying: boolean;
  // Current time in seconds
  currentTime: number;
  // Volume (0-1)
  volume: number;
  // Whether player is muted
  isMuted: boolean;
  // Whether shuffle is enabled
  isShuffled: boolean;
  // Original queue before shuffle
  originalQueue: ISong[];
  // Repeat mode: 'off' | 'all' | 'one'
  repeatMode: 'off' | 'all' | 'one';
}

interface AudioActions {
  // Set the current song and queue
  setCurrentSong: (song: ISong, queue?: ISong[]) => void;
  // Play audio
  play: () => void;
  // Pause audio
  pause: () => void;
  // Toggle play/pause
  togglePlay: () => void;
  // Play next song
  next: () => void;
  // Play previous song
  previous: () => void;
  // Set current time
  setCurrentTime: (time: number) => void;
  // Set volume
  setVolume: (volume: number) => void;
  // Toggle mute
  toggleMute: () => void;
  // Toggle shuffle
  toggleShuffle: () => void;
  // Toggle repeat mode (off -> all -> one -> off)
  toggleRepeat: () => void;
  // Add song to queue
  addToQueue: (song: ISong) => void;
  // Clear queue
  clearQueue: () => void;
}

type AudioStore = AudioState & AudioActions;

/**
 * Zustand Store for Audio Player
 * Global state management for the music player
 */
export const useAudioStore = create<AudioStore>((set, get) => ({
  // Initial state
  currentSong: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  isMuted: false,
  isShuffled: false,
  originalQueue: [],
  repeatMode: 'off',

  // Set current song and optionally set queue
  setCurrentSong: (song, queue) => {
    const songQueue = queue || [song];
    set({
      currentSong: song,
      queue: songQueue,
      currentIndex: songQueue.findIndex((s) => s._id.toString() === song._id.toString()),
      isPlaying: true,
    });
  },

  // Play audio
  play: () => set({ isPlaying: true }),

  // Pause audio
  pause: () => set({ isPlaying: false }),

  // Toggle play/pause
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  // Play next song
  next: () => {
    const { queue, currentIndex, repeatMode } = get();
    if (queue.length === 0) return;

    // If repeat one, just restart current song
    if (repeatMode === 'one') {
      set({
        currentTime: 0,
        isPlaying: true,
      });
      return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      // If repeat all, loop back to start, otherwise stop
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    set({
      currentIndex: nextIndex,
      currentSong: queue[nextIndex],
      isPlaying: true,
      currentTime: 0,
    });
  },

  // Play previous song
  previous: () => {
    const { queue, currentIndex, repeatMode } = get();
    if (queue.length === 0) return;

    // If repeat one, restart current song
    if (repeatMode === 'one') {
      set({
        currentTime: 0,
        isPlaying: true,
      });
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1; // Loop to end
    }

    set({
      currentIndex: prevIndex,
      currentSong: queue[prevIndex],
      isPlaying: true,
      currentTime: 0,
    });
  },

  // Set current time
  setCurrentTime: (time) => set({ currentTime: time }),

  // Set volume
  setVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ volume: clampedVolume, isMuted: clampedVolume === 0 });
  },

  // Toggle mute
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  // Toggle shuffle
  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue } = get();
    if (isShuffled) {
      // Restore original queue
      set({
        isShuffled: false,
        queue: originalQueue,
        currentIndex: originalQueue.findIndex(
          (s) => s._id.toString() === get().currentSong?._id.toString()
        ),
      });
    } else {
      // Shuffle queue
      const shuffled = fisherYatesShuffle([...queue]);
      set({
        isShuffled: true,
        originalQueue: queue,
        queue: shuffled,
        currentIndex: shuffled.findIndex(
          (s) => s._id.toString() === get().currentSong?._id.toString()
        ),
      });
    }
  },

  // Toggle repeat mode
  toggleRepeat: () => {
    const { repeatMode } = get();
    const nextMode: 'off' | 'all' | 'one' =
      repeatMode === 'off' ? 'all' :
      repeatMode === 'all' ? 'one' : 'off';
    set({ repeatMode: nextMode });
  },

  // Add song to queue
  addToQueue: (song) => {
    const { queue } = get();
    if (!queue.find((s) => s._id.toString() === song._id.toString())) {
      set({ queue: [...queue, song] });
    }
  },

  // Clear queue
  clearQueue: () => set({ queue: [], currentIndex: -1, currentSong: null, isPlaying: false }),
}));

