/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlaylistCard from "@/components/PlaylistCard";

interface Playlist {
  _id: string;
  name: string;
  songs: any[];
  coverUrl?: string;
}

type DialogMode = "create" | "edit";

/**
 * Spotify-style Playlists Page
 * Display and manage playlists with create/edit/delete controls
 */
export default function PlaylistsPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [formName, setFormName] = useState("");
  const [formCover, setFormCover] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const notifyPlaylistUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("playlist-update"));
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      router.replace("/auth/login");
      return;
    }

    fetchPlaylists();
  }, [router]);

  const fetchPlaylists = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!storedUser || !token) {
        router.replace("/auth/login");
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      if (!user.id) {
        router.replace("/auth/login");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/playlists?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (mode: DialogMode, playlistId?: string) => {
    setDialogMode(mode);
    if (mode === "edit" && playlistId) {
      const playlist = playlists.find((p) => p._id === playlistId);
      setActivePlaylistId(playlistId);
      setFormName(playlist?.name || "");
      setFormCover(playlist?.coverUrl || "");
    } else {
      setActivePlaylistId(null);
      setFormName("");
      setFormCover("");
    }
    setFeedback(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActionLoading(false);
    setFeedback(null);
    setFormCover("");
  };

  const handleDialogSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFeedback("Playlist name is required.");
      return;
    }

    try {
      setActionLoading(true);
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!storedUser || !token) {
        router.replace("/auth/login");
        return;
      }

      const user = JSON.parse(storedUser);
      if (!user.id) {
        router.replace("/auth/login");
        return;
      }

      if (dialogMode === "create") {
        await fetch("/api/playlists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedName,
            userId: user.id,
            songs: [],
            coverUrl: formCover.trim() || undefined,
          }),
        });
      } else if (activePlaylistId) {
        await fetch("/api/playlists", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            playlistId: activePlaylistId,
            name: trimmedName,
            coverUrl: formCover.trim(),
          }),
        });
      }

      closeDialog();
      fetchPlaylists();
      notifyPlaylistUpdate();
    } catch (error) {
      console.error("Error saving playlist:", error);
      setFeedback("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!storedUser || !token) {
        router.replace("/auth/login");
        return;
      }

      await fetch("/api/playlists", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playlistId: deleteTarget._id,
        }),
      });

      setDeleteTarget(null);
      fetchPlaylists();
      notifyPlaylistUpdate();
    } catch (error) {
      console.error("Error deleting playlist:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-[#282828] rounded w-72"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-[#282828] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <section className="px-8 py-12 bg-gradient-to-b from-[#212121] to-transparent">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.5em] text-white/60">
              Your Library
            </p>
            <h1 className="text-4xl md:text-5xl font-black mt-2">
              Craft the perfect vibe
            </h1>
            <p className="text-white/70 mt-3 max-w-xl">
              Build and organize playlists. Edit titles on the fly and clean up
              old sessions when the mood shifts.
            </p>
          </div>
          <button
            onClick={() => openDialog("create")}
            className="px-6 py-3 bg-white text-black rounded-full text-sm font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            New playlist
          </button>
        </div>
      </section>

      <section className="px-8 mt-8">
        {playlists.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
            <p className="text-white/70 text-lg mb-4">
              You haven&apos;t created any playlists yet.
            </p>
            <button
              onClick={() => openDialog("create")}
              className="px-6 py-2 bg-white text-black rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              Create your first playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onEdit={() => openDialog("edit", playlist._id)}
                onDelete={() => setDeleteTarget(playlist)}
              />
            ))}
          </div>
        )}
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-lg bg-[#181818] rounded-3xl p-8 shadow-2xl border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/60">
                  Playlist
                </p>
                <h2 className="text-3xl font-bold">
                  {dialogMode === "create" ? "Create playlist" : "Edit details"}
                </h2>
              </div>
              <button
                onClick={closeDialog}
                className="text-white/50 hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <form className="space-y-5" onSubmit={handleDialogSubmit}>
              <label className="block">
                <span className="text-sm text-white/60">Playlist name</span>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white"
                  placeholder="My mellow Monday mix"
                  maxLength={120}
                  required
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-sm text-white/60">Cover image URL</span>
                <input
                  type="url"
                  value={formCover}
                  onChange={(e) => setFormCover(e.target.value)}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white"
                  placeholder="https://..."
                />
                <p className="text-xs text-white/40 mt-1">
                  Paste any square image link (at least 300×300) to customize
                  the playlist art.
                </p>
              </label>

              {feedback && <p className="text-sm text-red-400">{feedback}</p>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-60"
                >
                  {actionLoading
                    ? "Saving..."
                    : dialogMode === "create"
                    ? "Create"
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-[#181818] rounded-3xl p-6 border border-white/5 shadow-2xl text-center space-y-4">
            <h3 className="text-2xl font-bold">Delete playlist?</h3>
            <p className="text-white/70">
              This will permanently remove{" "}
              <span className="font-semibold">{deleteTarget.name}</span>. You
              can always create a new mix later.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-6 py-2 rounded-full bg-red-500 text-black text-sm font-semibold disabled:opacity-60"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
