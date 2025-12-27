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
  const isEditing = Boolean(editingSong);

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
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
          throw new Error("Please select both an audio file and a cover image.");
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
              throw new Error("Upload did not return a new audio file location.");
            }
          }

          if (imageFile) {
            coverFilePath = uploadJson?.data?.coverUrl;
            if (!coverFilePath) {
              throw new Error("Upload did not return a new cover image location.");
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
        headers,
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
      setModalError(error instanceof Error ? error.message : "Failed to save song.");
    } finally {
      setSaving(false);
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
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
          className="w-full max-w-md px-4 py-2 bg-[#121212] border border-[#282828] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
              {modalError && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded">
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
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-blue-500"
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
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">Select a category</option>
                  <option value="Pop">Pop</option>
                  <option value="rock">rock</option>
                  <option value="hip hop">hip hop</option>
                  <option value="jazz">jazz</option>
                  <option value="electronic">electronic</option>
                  <option value="classical">classical</option>
                  <option value="country">country</option>
                  <option value="R&B">R&B</option>
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
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  {detectedDuration && (
                    <p className="text-xs text-gray-400 mt-1">
                      Latest detected duration: {formatDuration(detectedDuration)}
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
                  {isEditing
                    ? "(optional – upload to replace)"
                    : "(required)"}
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    setAudioFile(e.target.files?.[0] || null)
                  }
                  required={!isEditing}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                />
                {isEditing && formData.audioUrl && (
                  <p className="text-xs text-gray-400 mt-1">
                    Current audio:{" "}
                    <a
                      href={formData.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      View
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image{" "}
                  {isEditing
                    ? "(optional – upload to replace)"
                    : "(required)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] || null)
                  }
                  required={!isEditing}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-green-500"
                />
                {isEditing && formData.coverUrl && (
                  <p className="text-xs text-gray-400 mt-1">
                    Current cover:{" "}
                    <a
                      href={formData.coverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      View
                    </a>
                  </p>
                )}
              </div>


              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
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

