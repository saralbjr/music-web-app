"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders, getAdminToken } from "@/lib/adminAuth";

interface Song {
  _id: string;
  title: string;
  artist: string;
  duration: number;
  audioFile: string;
  coverFile: string;
  category: string;
  playCount: number;
  createdAt: string;
}

type SortField = "title" | "artist" | "createdAt" | "playCount";
type SortOrder = "asc" | "desc";

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
    audioFile: "",
    coverFile: "",
    category: "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const isEditing = Boolean(editingSong);

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortField, sortOrder, currentPage]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const offset = (currentPage - 1) * limit;
      let url = `/api/admin/songs?limit=${limit}&offset=${offset}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        // Client-side sorting
        let sortedSongs = [...data.data];
        sortedSongs.sort((a, b) => {
          let aVal: any = a[sortField];
          let bVal: any = b[sortField];

          if (sortField === "createdAt") {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
          }

          if (typeof aVal === "string") {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }

          if (sortOrder === "asc") {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });

        setSongs(sortedSongs);
        setTotal(data.total || 0);
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
        setSelectedSongs(new Set());
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting song:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSongs.size === 0) return;
    if (
      !confirm(`Are you sure you want to delete ${selectedSongs.size} song(s)?`)
    )
      return;

    try {
      const headers = getAuthHeaders();
      const deletePromises = Array.from(selectedSongs).map((id) =>
        fetch(`/api/admin/songs/${id}`, {
          method: "DELETE",
          headers,
        })
      );
      await Promise.all(deletePromises);
      fetchSongs();
      setSelectedSongs(new Set());
    } catch (error) {
      console.error("Error deleting songs:", error);
      alert("Failed to delete some songs");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedSongs.size === songs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(songs.map((s) => s._id)));
    }
  };

  const handleSelectSong = (id: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSongs(newSelected);
  };

  const handleEdit = (song: Song) => {
    setModalError("");
    setAudioFile(null);
    setImageFile(null);
    setDetectedDuration(song.duration);
    setEditingSong(song);
    setFormData({
      title: song.title,
      artist: song.artist,
      duration: song.duration.toString(),
      audioFile: song.audioFile,
      coverFile: song.coverFile,
      category: song.category,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setSaving(true);

    try {
      const headers = getAuthHeaders();
      const url = isEditing
        ? `/api/admin/songs/${editingSong!._id}`
        : "/api/admin/songs";
      const method = isEditing ? "PUT" : "POST";

      let audioFilePath = formData.audioFile;
      let coverFilePath = formData.coverFile;
      let durationValue = formData.duration
        ? parseInt(formData.duration, 10)
        : Number.NaN;

      if (!isEditing) {
        if (!audioFile || !imageFile) {
          throw new Error(
            "Please select both an audio file and a cover image."
          );
        }

        const uploadFormData = new FormData();
        uploadFormData.append("audio", audioFile);
        uploadFormData.append("image", imageFile);

        const token = getAdminToken();
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload files.");
        }

        const uploadJson = await uploadRes.json();

        audioFilePath = uploadJson?.data?.audioUrl;
        coverFilePath = uploadJson?.data?.coverUrl;
        const detected = uploadJson?.data?.duration;

        if (!audioFilePath || !coverFilePath) {
          throw new Error("Upload did not return file locations.");
        }

        if (!detected || Number.isNaN(detected)) {
          throw new Error(
            "Could not determine audio duration. Please try a different file."
          );
        }

        durationValue = detected;
        setDetectedDuration(detected);
        setFormData((prev) => ({
          ...prev,
          duration: detected.toString(),
          audioFile: audioFilePath,
          coverFile: coverFilePath,
        }));
      } else {
        if (audioFile || imageFile) {
          const uploadFormData = new FormData();
          if (audioFile) {
            uploadFormData.append("audio", audioFile);
          }
          if (imageFile) {
            uploadFormData.append("image", imageFile);
          }

          const token = getAdminToken();
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: uploadFormData,
          });

          if (!uploadRes.ok) {
            throw new Error("Failed to upload files.");
          }

          const uploadJson = await uploadRes.json();

          if (audioFile) {
            audioFilePath = uploadJson?.data?.audioUrl;
            const detected = uploadJson?.data?.duration;
            if (detected && !Number.isNaN(detected)) {
              durationValue = detected;
              setDetectedDuration(detected);
              setFormData((prev) => ({
                ...prev,
                audioFile: audioFilePath || prev.audioFile,
                duration: detected.toString(),
              }));
            } else {
              setFormData((prev) => ({
                ...prev,
                audioFile: audioFilePath || prev.audioFile,
              }));
            }
            if (!audioFilePath) {
              throw new Error(
                "Upload did not return a new audio file location."
              );
            }
          }

          if (imageFile) {
            coverFilePath = uploadJson?.data?.coverUrl;
            if (!coverFilePath) {
              throw new Error(
                "Upload did not return a new cover image location."
              );
            }
            setFormData((prev) => ({
              ...prev,
              coverFile: coverFilePath,
            }));
          }
        }

        if (!audioFilePath || !coverFilePath) {
          throw new Error("Audio and cover image are required.");
        }

        if (!durationValue || Number.isNaN(durationValue)) {
          throw new Error("Duration must be a valid number.");
        }
      }

      const payload = {
        title: formData.title,
        artist: formData.artist,
        category: formData.category,
        duration: durationValue,
        audioFile: audioFilePath,
        coverFile: coverFilePath,
      };

      const res = await fetch(url, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save song.");
      }

      setShowModal(false);
      setEditingSong(null);
      setFormData({
        title: "",
        artist: "",
        duration: "",
        audioFile: "",
        coverFile: "",
        category: "",
      });
      setAudioFile(null);
      setImageFile(null);
      setDetectedDuration(null);
      fetchSongs();
    } catch (error) {
      console.error("Error saving song:", error);
      setModalError(
        error instanceof Error ? error.message : "Failed to save song."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && songs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-64 bg-[#282828] rounded animate-pulse mb-2"></div>
            <div className="h-5 w-48 bg-[#282828] rounded animate-pulse"></div>
          </div>
          <div className="h-12 w-32 bg-[#282828] rounded-lg animate-pulse"></div>
        </div>

        {/* Search and Bulk Actions Skeleton */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg animate-pulse">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full h-12 bg-[#282828] rounded-lg"></div>
            <div className="h-12 w-32 bg-[#282828] rounded-lg"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl border border-[#282828] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#121212] sticky top-0 z-10 border-b border-[#282828]">
                <tr>
                  {[...Array(9)].map((_, idx) => (
                    <th key={idx} className="px-6 py-4">
                      <div className="h-4 w-24 bg-[#282828] rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {[...Array(5)].map((_, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-[#1a1a1a]">
                    {[...Array(9)].map((_, colIdx) => (
                      <td key={colIdx} className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {colIdx === 0 && (
                            <div className="w-4 h-4 rounded bg-[#282828] animate-pulse"></div>
                          )}
                          {colIdx === 1 && (
                            <div className="w-12 h-12 rounded bg-[#282828] animate-pulse"></div>
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
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Songs Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all songs in the system
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSong(null);
            setFormData({
              title: "",
              artist: "",
              duration: "",
              audioFile: "",
              coverFile: "",
              category: "",
            });
            setModalError("");
            setAudioFile(null);
            setImageFile(null);
            setDetectedDuration(null);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-[#1d4ed8] hover:bg-[#1ed760] text-white rounded-lg font-medium transition-all shadow-lg shadow-[#1d4ed8]/20 hover:shadow-[#1d4ed8]/30"
        >
          + Add Song
        </button>
      </div>

      {/* Search and Bulk Actions */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
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
                placeholder="Search songs by title, artist, or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#1d4ed8] transition-colors"
              />
            </div>
          </div>
          {selectedSongs.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              Delete Selected ({selectedSongs.size})
            </button>
          )}
        </div>
      </div>

      {/* Songs Table */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl border border-[#282828] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#121212] sticky top-0 z-10 border-b border-[#282828]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedSongs.size === songs.length && songs.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[#282828] bg-[#000000] text-[#1d4ed8] focus:ring-[#1d4ed8]"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Cover
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Title</span>
                    {sortField === "title" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("artist")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Artist</span>
                    {sortField === "artist" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Genre
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("playCount")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Plays</span>
                    {sortField === "playCount" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Upload Date</span>
                    {sortField === "createdAt" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282828]">
              {songs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <p className="text-gray-400">No songs found</p>
                  </td>
                </tr>
              ) : (
                songs.map((song) => (
                  <tr
                    key={song._id}
                    className="hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSongs.has(song._id)}
                        onChange={() => handleSelectSong(song._id)}
                        className="w-4 h-4 rounded border-[#282828] bg-[#000000] text-[#1d4ed8] focus:ring-[#1d4ed8]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-[#282828] flex-shrink-0 overflow-hidden">
                        {song.coverFile ? (
                          <img
                            src={song.coverFile}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {song.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{song.artist}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDuration(song.duration)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                        {song.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {song.playCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(song.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(song)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-all border border-blue-600/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(song._id)}
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
              {Math.min(currentPage * limit, total)} of {total} songs
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 w-full max-w-2xl border border-[#282828] shadow-2xl my-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingSong ? "Edit Song" : "Add Song"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalError && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
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
                    className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                >
                  <option value="">Select a category</option>
                  <option value="Pop">Pop</option>
                  <option value="Rock">Rock</option>
                  <option value="Hip Hop">Hip Hop</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Classical">Classical</option>
                  <option value="Country">Country</option>
                  <option value="R&B">R&B</option>
                  <option value="Indie">Indie</option>
                </select>
              </div>

              {isEditing ? (
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
                    className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                  />
                  {detectedDuration && (
                    <p className="text-xs text-gray-400 mt-1">
                      Latest detected duration:{" "}
                      {formatDuration(detectedDuration)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {detectedDuration
                    ? `Detected duration: ${formatDuration(detectedDuration)}`
                    : "Duration will be detected automatically after uploading your audio."}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio File{" "}
                  {isEditing ? "(optional – upload to replace)" : "(required)"}
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  required={!isEditing}
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                />
                {isEditing && formData.audioFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    Current audio:{" "}
                    <a
                      href={formData.audioFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1d4ed8] underline"
                    >
                      View
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image{" "}
                  {isEditing ? "(optional – upload to replace)" : "(required)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  required={!isEditing}
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                />
                {isEditing && formData.coverFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    Current cover:{" "}
                    <a
                      href={formData.coverFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1d4ed8] underline"
                    >
                      View
                    </a>
                  </p>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#1d4ed8] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-[#1d4ed8]/20"
                >
                  {saving ? "Saving..." : isEditing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSong(null);
                    setAudioFile(null);
                    setImageFile(null);
                    setModalError("");
                    setDetectedDuration(null);
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
