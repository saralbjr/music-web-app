"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/adminAuth";

interface Song {
  _id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  category: string;
  playCount: number;
  createdAt: string;
}

/**
 * Admin Songs Management Page
 */
export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    duration: "",
    audioUrl: "",
    coverUrl: "",
    category: "",
  });

  useEffect(() => {
    fetchSongs();
  }, [search]);

  const fetchSongs = async () => {
    try {
      const headers = getAuthHeaders();
      const url = search
        ? `/api/admin/songs?search=${encodeURIComponent(search)}`
        : "/api/admin/songs";
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setSongs(data.data);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return;

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/songs/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        fetchSongs();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting song:", error);
    }
  };

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      artist: song.artist,
      duration: song.duration.toString(),
      audioUrl: song.audioUrl,
      coverUrl: song.coverUrl,
      category: song.category,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const url = editingSong
        ? `/api/admin/songs/${editingSong._id}`
        : "/api/admin/songs";
      const method = editingSong ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingSong(null);
        setFormData({
          title: "",
          artist: "",
          duration: "",
          audioUrl: "",
          coverUrl: "",
          category: "",
        });
        fetchSongs();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving song:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Songs Management</h1>
        <button
          onClick={() => {
            setEditingSong(null);
            setFormData({
              title: "",
              artist: "",
              duration: "",
              audioUrl: "",
              coverUrl: "",
              category: "",
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          Add Song
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-[#121212] border border-[#282828] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Songs Table */}
      <div className="bg-[#121212] rounded-lg border border-[#282828] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Artist
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Plays
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282828]">
            {songs.map((song) => (
              <tr key={song._id} className="hover:bg-[#1a1a1a]">
                <td className="px-6 py-4 text-white">{song.title}</td>
                <td className="px-6 py-4 text-gray-300">{song.artist}</td>
                <td className="px-6 py-4 text-gray-300">
                  {formatDuration(song.duration)}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {song.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">{song.playCount}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(song)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(song._id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121212] rounded-lg p-6 w-full max-w-2xl border border-[#282828] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingSong ? "Edit Song" : "Add Song"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Artist
                  </label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) =>
                      setFormData({ ...formData, artist: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    required
                    min="0"
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio URL
                </label>
                <input
                  type="url"
                  value={formData.audioUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, audioUrl: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.coverUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, coverUrl: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  {editingSong ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSong(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

