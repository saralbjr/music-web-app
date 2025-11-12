"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/adminAuth";

interface Playlist {
  _id: string;
  name: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  songs: any[];
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

/**
 * Admin Playlists Management Page
 */
export default function AdminPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    userId: "",
  });

  useEffect(() => {
    fetchPlaylists();
    fetchUsers();
  }, [search]);

  const fetchPlaylists = async () => {
    try {
      const headers = getAuthHeaders();
      const url = search
        ? `/api/admin/playlists?search=${encodeURIComponent(search)}`
        : "/api/admin/playlists";
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/admin/users?limit=1000", { headers });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/playlists/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        fetchPlaylists();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      userId: playlist.userId._id.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const url = editingPlaylist
        ? `/api/admin/playlists/${editingPlaylist._id}`
        : "/api/admin/playlists";
      const method = editingPlaylist ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: formData.name,
          userId: formData.userId,
          songs: editingPlaylist?.songs?.map((s: any) => s._id || s) || [],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingPlaylist(null);
        setFormData({ name: "", userId: "" });
        fetchPlaylists();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving playlist:", error);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Playlists Management</h1>
        <button
          onClick={() => {
            setEditingPlaylist(null);
            setFormData({ name: "", userId: "" });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          Add Playlist
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search playlists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-[#121212] border border-[#282828] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Playlists Table */}
      <div className="bg-[#121212] rounded-lg border border-[#282828] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Songs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282828]">
            {playlists.map((playlist) => (
              <tr key={playlist._id} className="hover:bg-[#1a1a1a]">
                <td className="px-6 py-4 text-white">{playlist.name}</td>
                <td className="px-6 py-4 text-gray-300">
                  {playlist.userId?.name || "Unknown"} (
                  {playlist.userId?.email || "N/A"})
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {playlist.songs?.length || 0} songs
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(playlist.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(playlist)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(playlist._id)}
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
          <div className="bg-[#121212] rounded-lg p-6 w-full max-w-md border border-[#282828]">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPlaylist ? "Edit Playlist" : "Add Playlist"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Owner (User)
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) =>
                    setFormData({ ...formData, userId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  {editingPlaylist ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlaylist(null);
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

