"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAudioStore } from "@/lib/store/audioStore";
import { ISong } from "@/models/Song";

/**
 * Spotify-style AudioPlayer Component
 * Fixed bottom player bar with song info, controls, and volume
 */
export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekTimeRef = useRef<number | null>(null);
  const {
    currentSong,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    queue,
    currentIndex,
    play,
    pause,
    togglePlay,
    next,
    previous,
    setCurrentTime,
    setVolume,
    toggleMute,
  } = useAudioStore();

  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const lastStoreUpdateRef = useRef<number>(0);

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
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Reset time when song changes
  useEffect(() => {
    if (currentSong) {
      setLocalTime(0);
      lastUpdateRef.current = 0;
      lastStoreUpdateRef.current = 0;
      seekTimeRef.current = null;
      checkIfLiked();
    }
  }, [currentSong?._id]);

  // Check if current song is liked
  const checkIfLiked = async () => {
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
          const liked = data.data.some(
            (likedSong: ISong) => likedSong._id.toString() === currentSong._id.toString()
          );
          setIsLiked(liked);
        }
      }
    } catch (error) {
      console.error("Error checking if liked:", error);
    }
  };

  const handleLike = async () => {
    if (!currentSong) return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    setLiking(true);
    try {
      const response = await fetch("/api/songs/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: currentSong._id.toString() }),
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent(data.isLiked ? "song-liked" : "song-unliked", {
            detail: { songId: currentSong._id.toString() },
          })
        );
      }
    } catch (error) {
      console.error("Error liking song:", error);
    } finally {
      setLiking(false);
    }
  };

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

  const handleEnded = () => {
    if (currentIndex < queue.length - 1) {
      next();
    } else {
      pause();
    }
  };

  if (!currentSong) {
    return null;
  }

  const progressPercent = duration > 0 ? (localTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-[#181818] border-t border-[#282828] z-50">
      {/* Progress Bar */}
      <div
        className="h-1 bg-[#282828] cursor-pointer hover:h-[4px] transition-all"
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
        <div
          className="h-full bg-white hover:bg-blue-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-between h-[89px] px-4">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 flex-1 min-w-[180px] max-w-[30%]">
          {currentSong.coverFile && (
            <img
              src={currentSong.coverFile}
              alt={currentSong.title}
              className="w-14 h-14 rounded object-cover shadow-lg"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate hover:underline cursor-pointer">
              {currentSong.title}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {currentSong.artist}
            </div>
          </div>
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={liking}
            className={`p-2 rounded-full transition-all ${
              isLiked
                ? "text-blue-500 hover:text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <svg
              className="w-5 h-5"
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
        <div className="flex flex-col items-center gap-1 flex-1 max-w-[722px]">
          <div className="flex items-center gap-4">
            <button
              onClick={previous}
              disabled={queue.length <= 1}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={next}
              disabled={queue.length <= 1}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0011 6v2.798l-5.445-3.63z" />
              </svg>
            </button>
          </div>

          {/* Time and Seek Bar */}
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-gray-400 w-11 text-right font-mono">
              {formatTime(localTime)}
            </span>
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
              className="flex-1 h-1 bg-[#535353] rounded-lg appearance-none cursor-pointer hover:h-[4px] transition-all"
              style={{
                background: `linear-gradient(to right, #fff 0%, #fff ${progressPercent}%, #535353 ${progressPercent}%, #535353 100%)`,
              }}
            />
            <span className="text-xs text-gray-400 w-11 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume Control */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-[180px] max-w-[30%]">
          <button
            onClick={toggleMute}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.707a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : volume < 0.5 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.707a1 1 0 011.617.793z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.707a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-[#535353] rounded-lg appearance-none cursor-pointer hover:h-[4px] transition-all"
            style={{
              background: `linear-gradient(to right, #fff 0%, #fff ${volume * 100}%, #535353 ${volume * 100}%, #535353 100%)`,
            }}
          />
        </div>
      </div>

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
    </div>
  );
}
