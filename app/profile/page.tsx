"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

interface ListeningMoment {
  title: string;
  description: string;
  gradient: string;
}

const listeningMoments: ListeningMoment[] = [
  {
    title: "Morning Flow",
    description: "Calm beats to ease into the day",
    gradient: "from-amber-500/70 to-rose-500/60",
  },
  {
    title: "Focus Mode",
    description: "Instrumentals that keep you in the zone",
    gradient: "from-blue-600/70 to-cyan-500/60",
  },
  {
    title: "Night Drive",
    description: "Late-night vibes with deep basslines",
    gradient: "from-purple-700/70 to-indigo-600/60",
  },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [recentSongs, setRecentSongs] = useState<ISong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  useEffect(() => {
    const fetchRecentSongs = async () => {
      setLoadingSongs(true);
      try {
        const res = await fetch("/api/songs?limit=6");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setRecentSongs(data.data);
        } else {
          setRecentSongs([]);
        }
      } catch (error) {
        console.error("Failed to load profile songs", error);
        setRecentSongs([]);
      } finally {
        setLoadingSongs(false);
      }
    };

    fetchRecentSongs();
  }, []);

  const displayName = user?.name || "Guest Listener";
  const memberSince =
    user?.createdAt || user?.updatedAt
      ? new Date(user.createdAt || user.updatedAt).getFullYear()
      : new Date().getFullYear();
  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map((segment: string) => segment.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [displayName]);

  return (
    <div className="min-h-full space-y-10">
      <section className="relative bg-gradient-to-b from-emerald-700/80 via-emerald-900/40 to-transparent px-8 py-10">
        <div className="flex flex-wrap items-end gap-8">
          <div className="w-48 h-48 rounded-full bg-emerald-500 shadow-2xl flex items-center justify-center overflow-hidden ring-8 ring-emerald-400/40">
            {user?.image ? (
              <img
                src={user.image}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-5xl font-black text-white">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-[250px]">
            <p className="uppercase tracking-[0.3em] text-white/70 font-semibold text-xs mb-1">
              Profile
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black">
              {displayName}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="font-semibold text-white">
                {user?.email || "Not signed in"}
              </span>
              <span>•</span>
              <span>{recentSongs.length || 0} liked songs</span>
              <span>•</span>
              <span>Member since {memberSince}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/profile/settings"
              className="px-5 py-2 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform"
            >
              Edit profile
            </Link>
            <button className="px-5 py-2 rounded-full border border-white/40 font-semibold text-sm text-white hover:border-white transition-colors">
              Share
            </button>
          </div>
        </div>
      </section>

      <section className="px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Followers", value: "2,341" },
            { label: "Following", value: "128" },
            { label: "Playlists", value: "12" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-[#1DB954]/20 to-transparent border border-white/5 rounded-2xl p-6 shadow-lg"
            >
              <p className="text-sm text-white/60 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#181818] rounded-3xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Top Genres</h2>
                <p className="text-sm text-white/60">
                  Based on your recent listening habits
                </p>
              </div>
              {/* <Link
                href="/discover"
                className="text-sm text-white/70 hover:text-white"
              >
                View more
              </Link> */}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Indie Pop",
                "Neo Soul",
                "Lo-fi",
                "Jazz Fusion",
                "Synthwave",
                "Alt R&B",
              ].map((genre) => (
                <div
                  key={genre}
                  className="bg-white/5 rounded-2xl px-4 py-6 text-center border border-white/5"
                >
                  <p className="text-sm text-white/60">Genre</p>
                  <p className="text-lg font-semibold">{genre}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#181818] rounded-3xl p-6 border border-white/5">
            <h2 className="text-2xl font-bold mb-6">Listening streak</h2>
            <div className="space-y-4">
              {[...Array(7)].map((_, idx) => {
                const isActive = idx >= 2;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isActive
                          ? "bg-emerald-500 text-black"
                          : "bg-white/5 text-white/40"
                      }`}
                    >
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full ${
                          isActive ? "bg-emerald-500" : "bg-white/10"
                        }`}
                        style={{ width: isActive ? "85%" : "40%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {listeningMoments.map((moment) => (
            <div
              key={moment.title}
              className={`rounded-3xl p-6 bg-gradient-to-br ${moment.gradient} border border-white/10 shadow-xl`}
            >
              <p className="text-sm uppercase tracking-widest text-white/70">
                Curated mode
              </p>
              <h3 className="text-2xl font-bold mt-2">{moment.title}</h3>
              <p className="text-sm text-white/80 mt-1">{moment.description}</p>
              <button className="mt-6 px-4 py-2 text-sm font-semibold bg-white/90 text-black rounded-full hover:bg-white transition">
                Start session
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Recently played</h2>
            <p className="text-sm text-white/60">
              A snapshot of the artists you keep coming back to
            </p>
          </div>
          <Link
            href="/library"
            className="text-sm text-white/70 hover:text-white"
          >
            View library
          </Link>
        </div>

        {loadingSongs ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse bg-[#181818] rounded-2xl h-64"
              />
            ))}
          </div>
        ) : recentSongs.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentSongs.map((song) => {
              const songId = String(song._id);
              return <SongCard key={songId} song={song} queue={recentSongs} />;
            })}
          </div>
        ) : (
          <div className="text-center text-white/60 py-16 bg-[#181818] rounded-3xl border border-white/5">
            No recent activity yet. Start listening to fill this space.
          </div>
        )}
      </section>
    </div>
  );
}
