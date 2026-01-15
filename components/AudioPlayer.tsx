"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useAudioStore } from "@/lib/store/audioStore";
import { ISong } from "@/models/Song";

/**
 * Spotify-style AudioPlayer Component
 * Fixed bottom player bar with song info, controls, and volume
 */
export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekTimeRef = useRef<number | null>(null);
  const playLoggedSongIdRef = useRef<string | null>(null);
  const {
    currentSong,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    pause,
    togglePlay,
    next,
    previous,
    setCurrentTime,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = useAudioStore();

  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const lastStoreUpdateRef = useRef<number>(0);
  const playStartTimeRef = useRef<number | null>(null);
  const lastTrackedSongIdRef = useRef<string | null>(null);

  const getVolumeLevel = useCallback(() => {
    if (isMuted || volume === 0) return "muted";
    if (volume < 0.34) return "low";
    if (volume < 0.67) return "mid";
    return "high";
  }, [isMuted, volume]);

  const getSongId = (song: ISong): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawId = (song as any)?._id;
    if (typeof rawId === "string") return rawId;
    if (rawId && typeof rawId.toString === "function") return rawId.toString();
    return String(rawId ?? "");
  };

  /**
   * Track user behavior for analytics
   * Computer Science Concept: Data Mining - Collecting user interaction data
   */
  const trackBehavior = useCallback(
    async (
      action: "play" | "pause" | "skip" | "repeat" | "like" | "unlike",
      listenDuration?: number
    ) => {
      if (!currentSong) return;

      const token = localStorage.getItem("token");
      if (!token) return; // Only track for authenticated users

      try {
        const songId = getSongId(currentSong);
        await fetch("/api/behavior/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            songId,
            action,
            listenDuration,
          }),
        });
      } catch (error) {
        console.error("Error tracking behavior:", error);
      }
    },
    [currentSong]
  );

  // Update audio element when state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = 1.0;
    audio.defaultPlaybackRate = 1.0;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
      // Track play action and record start time
      if (currentSong) {
        const songId = getSongId(currentSong);
        if (lastTrackedSongIdRef.current !== songId) {
          trackBehavior("play");
          playStartTimeRef.current = Date.now();
          lastTrackedSongIdRef.current = songId;
        }
      }
    } else {
      audio.pause();
      // Track pause action and calculate listen duration
      if (currentSong && playStartTimeRef.current) {
        const listenDuration = Math.floor(
          (Date.now() - playStartTimeRef.current) / 1000
        );
        trackBehavior("pause", listenDuration);
      }
    }
  }, [isPlaying, currentSong, trackBehavior]);

  // When the track changes, reload the element and start playback from the beginning
  // NOTE: This effect intentionally only depends on the song id so that pausing
  // does NOT reset playback to the start when the user resumes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    // Reset element state to the beginning of the new track
    audio.currentTime = 0;
    audio.load();

    // Auto‑play the newly selected track
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Error playing audio after track change:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?._id]);

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Check if current song is liked
  const checkIfLiked = useCallback(async () => {
    if (!currentSong) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLiked(false);
        return;
      }

      const response = await fetch("/api/songs/like", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const currentSongId = getSongId(currentSong);
          const liked = data.data.some((likedSong: ISong) => {
            const likedSongId = getSongId(likedSong);
            return likedSongId === currentSongId;
          });
          setIsLiked(liked);
        }
      }
    } catch (error) {
      console.error("Error checking if liked:", error);
    }
  }, [currentSong]);

  const logPlayCount = useCallback(async (song: ISong) => {
    const songId = getSongId(song);
    if (!songId || playLoggedSongIdRef.current === songId) return;

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const resp = await fetch("/api/songs/play", {
        method: "POST",
        headers,
        body: JSON.stringify({ songId }),
      });

      if (resp.ok) {
        playLoggedSongIdRef.current = songId;
      }
    } catch (error) {
      console.error("Error logging play count:", error);
    }
  }, []);

  // Reset time when song changes
  useEffect(() => {
    if (currentSong) {
      // Track listen duration for previous song if it was playing
      if (playStartTimeRef.current && lastTrackedSongIdRef.current) {
        const listenDuration = Math.floor(
          (Date.now() - playStartTimeRef.current) / 1000
        );
        if (listenDuration > 0) {
          // Track the previous song's listen duration
          const token = localStorage.getItem("token");
          if (token) {
            fetch("/api/behavior/track", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                songId: lastTrackedSongIdRef.current,
                action: "play",
                listenDuration,
              }),
            }).catch((error) =>
              console.error("Error tracking previous song:", error)
            );
          }
        }
      }

      setLocalTime(0);
      lastUpdateRef.current = 0;
      lastStoreUpdateRef.current = 0;
      seekTimeRef.current = null;
      playLoggedSongIdRef.current = null;
      playStartTimeRef.current = null;
      lastTrackedSongIdRef.current = null;
      checkIfLiked();
      logPlayCount(currentSong);
    }
  }, [currentSong, checkIfLiked, logPlayCount]);

  const handleLike = useCallback(async () => {
    if (!currentSong) return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    setLiking(true);
    try {
      const songId = getSongId(currentSong);
      const response = await fetch("/api/songs/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId }),
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        // Track like/unlike action
        trackBehavior(data.isLiked ? "like" : "unlike");
        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent(data.isLiked ? "song-liked" : "song-unliked", {
            detail: { songId },
          })
        );
      }
    } catch (error) {
      console.error("Error liking song:", error);
    } finally {
      setLiking(false);
    }
  }, [currentSong, trackBehavior]);

  // Throttled time update handler
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;

    const now = Date.now();
    const newTime = audio.currentTime;

    if (now - lastUpdateRef.current > 16) {
      setLocalTime(newTime);
      lastUpdateRef.current = now;
    }

    if (now - lastStoreUpdateRef.current > 500) {
      setCurrentTime(newTime);
      lastStoreUpdateRef.current = now;
    }
  }, [isDragging, setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    setLocalTime(newTime);
    seekTimeRef.current = newTime;
    audio.currentTime = newTime;
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    const audio = audioRef.current;
    if (audio && seekTimeRef.current !== null) {
      audio.currentTime = seekTimeRef.current;
      setCurrentTime(seekTimeRef.current);
      seekTimeRef.current = null;
    }
  }, [setCurrentTime]);

  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleEnded = useCallback(() => {
    if (repeatMode === "one") {
      // Repeat current song
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
    } else if (repeatMode === "all") {
      // Repeat all - go to next or loop to start
      next();
    } else {
      // No repeat - go to next if available, otherwise pause
      if (currentIndex < queue.length - 1) {
        next();
      } else {
        pause();
      }
    }
  }, [repeatMode, currentIndex, queue.length, next, pause]);

  if (!currentSong) {
    return null;
  }

  const progressPercent = duration > 0 ? (localTime / duration) * 100 : 0;

  return (
    <>
      {/* Glassmorphism Audio Player */}
      <div className="fixed bottom-0 left-0 right-0 z-[110]">
        {/* Ambient Glow Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -bottom-10 left-1/4 w-96 h-32 rounded-full blur-[80px] transition-colors duration-1000"
            style={{
              background: isPlaying
                ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))'
                : 'rgba(59, 130, 246, 0.15)'
            }}
          />
          <div
            className="absolute -bottom-10 right-1/4 w-80 h-28 rounded-full blur-[70px] transition-colors duration-1000"
            style={{
              background: isPlaying
                ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.25), rgba(147, 197, 253, 0.25))'
                : 'rgba(59, 130, 246, 0.1)'
            }}
          />
        </div>

        {/* Glass Container */}
        <div className="relative bg-gradient-to-r from-[#0f0f14]/80 via-[#12121a]/85 to-[#0f0f14]/80 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          {/* Subtle Top Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          {/* Progress Bar - Enhanced */}
          <div
            className="group h-1 bg-white/[0.06] cursor-pointer hover:h-1.5 transition-all duration-200 relative"
            onClick={(e) => {
              const audio = audioRef.current;
              if (!audio) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              const newTime = percent * duration;
              audio.currentTime = newTime;
              setLocalTime(newTime);
              setCurrentTime(newTime);
            }}
          >
            {/* Progress Fill with Gradient */}
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 transition-all duration-100 relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Glowing Dot at End */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Hover Glow */}
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-between h-[88px] px-5">
            {/* Left: Song Info */}
            <div className="flex items-center gap-4 flex-1 min-w-[180px] max-w-[30%]">
              {currentSong.coverFile && (
                <div className="relative group/cover">
                  {/* Cover Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-sky-500/30 rounded-xl blur-lg opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300" />
                  <Image
                    src={currentSong.coverFile}
                    alt={currentSong.title}
                    width={56}
                    height={56}
                    className="relative rounded-lg object-cover shadow-xl ring-1 ring-white/10 group-hover/cover:ring-white/20 transition-all"
                    unoptimized
                  />
                  {/* Playing Indicator Overlay */}
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-lg bg-black/30 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-blue-400 rounded-full animate-[equalizer1_0.5s_ease-in-out_infinite]" />
                        <span className="w-1 bg-cyan-400 rounded-full animate-[equalizer2_0.6s_ease-in-out_infinite_0.1s]" />
                        <span className="w-1 bg-sky-400 rounded-full animate-[equalizer3_0.5s_ease-in-out_infinite_0.2s]" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate hover:text-blue-300 cursor-pointer transition-colors">
                  {currentSong.title}
                </div>
                <div className="text-xs text-white/50 truncate hover:text-white/70 cursor-pointer transition-colors">
                  {currentSong.artist}
                </div>
              </div>
              {/* Like Button - Enhanced */}
              <button
                onClick={handleLike}
                disabled={liking}
                className={`group/like p-2 rounded-full transition-all duration-300 ${
                  isLiked
                    ? "text-blue-500 hover:text-blue-400"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
                aria-label={isLiked ? "Unlike" : "Like"}
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${isLiked ? "scale-110" : "group-hover/like:scale-110"}`}
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Center: Playback Controls */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[722px]">
              <div className="flex items-center justify-center gap-2">
                {/* Shuffle Button */}
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    isShuffled
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  }`}
                  aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                  </svg>
                </button>

                {/* Previous Button */}
                <button
                  onClick={() => {
                    if (currentSong) {
                      trackBehavior("skip");
                    }
                    previous();
                  }}
                  disabled={queue.length <= 1 && repeatMode === "off"}
                  className="p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Play/Pause Button - Glass Effect */}
                <button
                  onClick={togglePlay}
                  className="group/play relative w-12 h-12 mx-2"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {/* Glow Ring */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 blur-md transition-opacity duration-300 ${isPlaying ? "opacity-50" : "opacity-0 group-hover/play:opacity-30"}`} />
                  {/* Button */}
                  <div className="relative w-full h-full bg-gradient-to-br from-white to-white/90 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform duration-200">
                    {isPlaying ? (
                      <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Next Button */}
                <button
                  onClick={() => {
                    if (currentSong) {
                      trackBehavior("skip");
                    }
                    next();
                  }}
                  disabled={queue.length <= 1 && repeatMode === "off"}
                  className="p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  aria-label="Next"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Repeat Button */}
                <button
                  onClick={() => {
                    toggleRepeat();
                    if (currentSong && repeatMode === "off") {
                      trackBehavior("repeat");
                    }
                  }}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    repeatMode !== "off"
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  }`}
                  aria-label={
                    repeatMode === "off"
                      ? "Enable repeat"
                      : repeatMode === "all"
                      ? "Repeat all"
                      : "Repeat one"
                  }
                >
                  {repeatMode === "one" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Time and Seek Bar */}
              <div className="flex items-center gap-3 w-full max-w-md">
                <span className="text-[11px] text-white/40 w-10 text-right font-medium tabular-nums">
                  {formatTime(localTime)}
                </span>
                <div className="relative flex-1 h-5 flex items-center group/seek">
                  {/* Track Background */}
                  <div className="absolute left-0 right-0 h-1 rounded-full bg-white/10 pointer-events-none" />
                  {/* Track Fill */}
                  <div
                    className="absolute left-0 h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 group-hover/seek:from-blue-400 group-hover/seek:to-cyan-400 transition-colors pointer-events-none"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* Input Range */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={localTime}
                    onChange={handleSeek}
                    onMouseDown={handleDragStart}
                    onMouseUp={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchEnd={handleDragEnd}
                    className="absolute inset-0 w-full h-full appearance-none cursor-pointer bg-transparent z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.5)] [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:cursor-pointer group-hover/seek:[&::-webkit-slider-thumb]:opacity-100 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.5)] [&::-moz-range-thumb]:opacity-0 [&::-moz-range-thumb]:transition-opacity [&::-moz-range-thumb]:cursor-pointer group-hover/seek:[&::-moz-range-thumb]:opacity-100 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent"
                  />
                </div>
                <span className="text-[11px] text-white/40 w-10 font-medium tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right: Volume Control */}
            <div className="flex items-center gap-3 flex-1 justify-end min-w-[180px] max-w-[30%]">
              <button
                onClick={toggleMute}
                className="p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-full transition-all"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {(() => {
                  const level = getVolumeLevel();
                  if (level === "muted") {
                    return (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.707a1 1 0 011.617.793z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M13.293 7.293a1 1 0 011.414 0L17 9.586l2.293-2.293a1 1 0 111.414 1.414L18.414 11l2.293 2.293a1 1 0 01-1.414 1.414L17 12.414l-2.293 2.293a1 1 0 01-1.414-1.414L15.586 11l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    );
                  }

                  if (level === "low") {
                    return (
                      <div className="flex items-center gap-[2px]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.707a1 1 0 011.617.793z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="h-2 w-0.5 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                    );
                  }

                  if (level === "mid") {
                    return (
                      <div className="flex items-center gap-[2px]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.707a1 1 0 011.617.793z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="h-2 w-0.5 rounded-full bg-blue-400/70 animate-pulse" />
                        <span className="h-3 w-0.5 rounded-full bg-cyan-400/80 animate-pulse" />
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-[2px]">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.707a1 1 0 011.617.793z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="h-2 w-0.5 rounded-full bg-blue-400/60 animate-pulse" />
                      <span className="h-3 w-0.5 rounded-full bg-cyan-400/80 animate-pulse" />
                      <span className="h-4 w-0.5 rounded-full bg-sky-400 animate-pulse" />
                    </div>
                  );
                })()}
              </button>

              {/* Volume Slider - Glass Style */}
              <div className="relative w-24 h-5 flex items-center group/vol">
                {/* Track Background */}
                <div className="absolute left-0 right-0 h-1 rounded-full bg-white/10 pointer-events-none" />
                {/* Track Fill */}
                <div
                  className="absolute left-0 h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 group-hover/vol:from-blue-400 group-hover/vol:to-cyan-400 transition-colors pointer-events-none"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
                {/* Input Range */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full appearance-none cursor-pointer bg-transparent z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.5)] [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:cursor-pointer group-hover/vol:[&::-webkit-slider-thumb]:opacity-100 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.5)] [&::-moz-range-thumb]:opacity-0 [&::-moz-range-thumb]:transition-opacity [&::-moz-range-thumb]:cursor-pointer group-hover/vol:[&::-moz-range-thumb]:opacity-100 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Keyframe Animations */}
      <style jsx>{`
        @keyframes equalizer1 {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
        @keyframes equalizer2 {
          0%, 100% { height: 8px; }
          50% { height: 12px; }
        }
        @keyframes equalizer3 {
          0%, 100% { height: 6px; }
          50% { height: 16px; }
        }
      `}</style>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentSong.audioFile}
        preload="metadata"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={(e) => {
          console.error("Audio error:", e);
        }}
        onLoadedData={(e) => {
          const audio = e.currentTarget;
          audio.playbackRate = 1.0;
          audio.defaultPlaybackRate = 1.0;
        }}
      />
    </>
  );
}
