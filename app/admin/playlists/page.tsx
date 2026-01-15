"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/adminAuth";

interface Song {
  _id: string;
  title?: string;
}

interface Playlist {
  _id: string;
  name: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  songs: Song[];
  createdAt: string;
  coverUrl?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

type ViewMode = "table" | "grid";

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
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  useEffect(() => {
    fetchPlaylists();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, currentPage]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const offset = (currentPage - 1) * limit;
      let url = `/api/admin/playlists?limit=${limit}&offset=${offset}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setPlaylists(data.data);
        setTotal(data.total || 0);
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
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          userId: formData.userId,
          songs: editingPlaylist?.songs?.map((s) => s._id || s) || [],
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

  const totalPages = Math.ceil(total / limit);

  if (loading && playlists.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-64 bg-[#282828] rounded animate-pulse mb-2"></div>
            <div className="h-5 w-48 bg-[#282828] rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-32 bg-[#282828] rounded-lg animate-pulse"></div>
            <div className="h-12 w-32 bg-[#282828] rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg animate-pulse">
          <div className="h-12 w-full bg-[#282828] rounded-lg"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl border border-[#282828] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#121212] sticky top-0 z-10 border-b border-[#282828]">
                <tr>
                  {[...Array(6)].map((_, idx) => (
                    <th key={idx} className="px-6 py-4">
                      <div className="h-4 w-24 bg-[#282828] rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {[...Array(5)].map((_, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-[#1a1a1a]">
                    {[...Array(6)].map((_, colIdx) => (
                      <td key={colIdx} className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {colIdx === 0 && (
                            <div className="w-12 h-12 rounded-lg bg-[#282828] animate-pulse"></div>
                          )}
                          <div className="h-4 w-32 bg-[#282828] rounded animate-pulse"></div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button and View Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Playlists Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all playlists in the system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-[#1a1a1a] rounded-lg p-1 border border-[#282828]">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "table"
                  ? "bg-[#1d4ed8] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-[#1d4ed8] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Grid
            </button>
          </div>
          <button
            onClick={() => {
              setEditingPlaylist(null);
              setFormData({ name: "", userId: "" });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-[#1d4ed8] hover:bg-[#1ed760] text-white rounded-lg font-medium transition-all shadow-lg shadow-[#1d4ed8]/20 hover:shadow-[#1d4ed8]/30"
          >
            + Add Playlist
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search playlists..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#1d4ed8] transition-colors"
          />
        </div>
      </div>

      {/* Playlists Display */}
      {viewMode === "table" ? (
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl border border-[#282828] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#121212] sticky top-0 z-10 border-b border-[#282828]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Cover
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Songs
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {playlists.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-gray-400">No playlists found</p>
                    </td>
                  </tr>
                ) : (
                  playlists.map((playlist) => (
                    <tr
                      key={playlist._id}
                      className="hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1d4ed8] to-[#1ed760] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {playlist.coverUrl ? (
                            <img
                              src={playlist.coverUrl}
                              alt={playlist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                              />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">
                          {playlist.name}
                        </span>
                      </td>
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
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(playlist)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-all border border-blue-600/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(playlist._id)}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-all border border-red-600/30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#282828] bg-[#121212] flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, total)} of {total} playlists
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#282828]"
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#282828]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No playlists found</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist._id}
                  className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-4 border border-[#282828] shadow-lg hover:shadow-[#1d4ed8]/20 hover:border-[#1d4ed8]/30 transition-all group cursor-pointer"
                >
                  <div className="relative mb-4">
                    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-[#1d4ed8] to-[#1ed760] flex items-center justify-center overflow-hidden">
                      {playlist.coverUrl ? (
                        <img
                          src={playlist.coverUrl}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-16 h-16 text-white/50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 10h16M4 14h16M4 18h16"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(playlist);
                          }}
                          className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(playlist._id);
                          }}
                          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1 truncate">
                      {playlist.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {playlist.userId?.name || "Unknown"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {playlist.songs?.length || 0} songs •{" "}
                      {new Date(playlist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination for Grid View */}
          {totalPages > 1 && (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, total)} of {total} playlists
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#282828]"
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#282828]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 w-full max-w-md border border-[#282828] shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">
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
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
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
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#1d4ed8] hover:bg-[#1ed760] text-white rounded-lg font-medium transition-all shadow-lg shadow-[#1d4ed8]/20"
                >
                  {editingPlaylist ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlaylist(null);
                  }}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg font-medium transition-all border border-[#282828]"
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
