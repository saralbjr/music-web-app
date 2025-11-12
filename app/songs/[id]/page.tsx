"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ISong } from "@/models/Song";
import { useAudioStore } from "@/lib/store/audioStore";
import { getRecommendations } from "@/lib/algorithms/recommend";
import SongCard from "@/components/SongCard";

/**
 * Spotify-style Single Song Page
 * Display song details and recommendations
 */
export default function SongPage() {
  const params = useParams();
  const { setCurrentSong, currentSong } = useAudioStore();
  const [song, setSong] = useState<ISong | null>(null);
  const [recommendations, setRecommendations] = useState<ISong[]>([]);
  const [allSongs, setAllSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSong();
    fetchAllSongs();
  }, [params.id]);

  useEffect(() => {
    if (song && allSongs.length > 0) {
      const recs = getRecommendations(allSongs, song.category, 6);
      const filteredRecs = recs.filter(
        (s) => s._id.toString() !== song._id.toString()
      );
      setRecommendations(filteredRecs);
    }
  }, [song, allSongs]);

  const fetchSong = async () => {
    try {
      const response = await fetch(`/api/songs/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setSong(data.data);
      }
    } catch (error) {
      console.error("Error fetching song:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSongs = async () => {
    try {
      const response = await fetch("/api/songs");
      const data = await response.json();

      if (data.success) {
        setAllSongs(data.data);
      }
    } catch (error) {
      console.error("Error fetching all songs:", error);
    }
  };

  const handlePlay = () => {
    if (song) {
      setCurrentSong(song, allSongs);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-[#282828] rounded"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-[#282828] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-400">Song not found.</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {song.coverUrl && (
          <div className="flex-shrink-0">
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-64 h-64 md:w-80 md:h-80 rounded-lg object-cover shadow-2xl"
            />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-end">
          <p className="text-sm font-semibold mb-2 text-gray-400">Song</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{song.title}</h1>
          <p className="text-xl text-gray-300 mb-6">{song.artist}</p>

          <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
            <span>{song.category}</span>
            <span>•</span>
            <span>{formatDuration(song.duration)}</span>
            <span>•</span>
            <span>{song.playCount || 0} plays</span>
          </div>

          <button
            onClick={handlePlay}
            className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-xl self-start"
            aria-label="Play"
          >
            <svg
              className="w-6 h-6 text-black ml-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">More like this</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recommendations.map((recSong) => (
              <SongCard
                key={recSong._id.toString()}
                song={recSong}
                queue={recommendations}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
